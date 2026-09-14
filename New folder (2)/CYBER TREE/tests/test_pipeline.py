import os
import sqlite3
import pytest
from unittest.mock import MagicMock, patch
import numpy as np

# Adjust sys.path to run tests from root
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scripts.db_client import DBClient
from scripts.embed_nodes import get_mock_embedding, build_text_for_embedding

@pytest.fixture
def temp_db(tmp_path):
    """Fixture that configures DBClient to use a temporary SQLite file."""
    db_file = tmp_path / "test_cyber_tree.db"
    os.environ["SQLITE_DB_PATH"] = str(db_file)
    # Clear supabase env to force SQLite fallback
    orig_url = os.environ.pop("SUPABASE_URL", None)
    orig_key = os.environ.pop("SUPABASE_KEY", None)
    
    client = DBClient()
    
    yield client, db_file
    
    # Restore env vars
    if orig_url:
        os.environ["SUPABASE_URL"] = orig_url
    if orig_key:
        os.environ["SUPABASE_KEY"] = orig_key


def test_sqlite_db_init(temp_db):
    """Verify tables are correctly created on SQLite initialization."""
    client, db_file = temp_db
    conn = sqlite3.connect(str(db_file))
    cursor = conn.cursor()
    
    # Query list of tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    
    assert "nodes" in tables
    assert "relationships" in tables
    assert "job_logs" in tables
    assert "raw_sources" in tables
    conn.close()


def test_mock_embedding_properties():
    """Verify mock embeddings are 384-dimensional unit vectors."""
    text = "Lazarus Group uses malicious payload targeting energy sector."
    vector = get_mock_embedding(text)
    
    assert isinstance(vector, list)
    assert len(vector) == 384
    
    # Verify unit length normalization
    arr = np.array(vector)
    norm = np.linalg.norm(arr)
    assert pytest.approx(norm, abs=1e-5) == 1.0


def test_build_text_for_embedding():
    """Verify build_text_for_embedding formats fields correctly."""
    node = {
        "title": "CVE-2026-9999",
        "summary": "Critical vulnerability in system service",
        "node_type": "vulnerability"
    }
    formatted = build_text_for_embedding(node)
    assert "Title: CVE-2026-9999" in formatted
    assert "Summary: Critical vulnerability in system service" in formatted
    assert "Type: vulnerability" in formatted


@patch('scripts.embed_nodes.connect_supabase')
@patch('scripts.embed_nodes.load_model')
def test_embed_pipeline_fallback(mock_load_model, mock_connect_supabase):
    """Test that embedding pipeline falls back to mock generation and tags metadata."""
    from scripts.embed_nodes import main as embed_main
    
    # Mock fastembed load failing by returning None (fallback triggers)
    mock_load_model.return_value = None
    
    # Mock Supabase client
    mock_client = MagicMock()
    mock_connect_supabase.return_value = mock_client
    
    # Mock fetch_unembedded_nodes data
    mock_nodes = [
        {
            "id": "node-uuid-1",
            "title": "Threat Actor Alpha",
            "summary": "APT actor details",
            "node_type": "threat_actor",
            "metadata": {"existing_key": 123}
        }
    ]
    
    # Mock fetch returning mock_nodes, then empty (to exit loop)
    def fetch_side_effect(client, limit, offset):
        if offset == 0:
            return mock_nodes
        return []
    
    with patch('scripts.embed_nodes.fetch_unembedded_nodes', side_effect=fetch_side_effect):
        with patch('scripts.embed_nodes.store_embedding') as mock_store:
            embed_main()
            
            # Verify store_embedding was called
            assert mock_store.call_count == 1
            call_args = mock_store.call_args[0]
            
            # call_args: (client, node_id, vector, metadata)
            assert call_args[1] == "node-uuid-1"
            
            # Check mock vector length
            vector = call_args[2]
            assert len(vector) == 384
            
            # Verify degraded_relevance is True in metadata
            meta = call_args[3]
            assert meta["existing_key"] == 123
            assert meta["degraded_relevance"] is True
