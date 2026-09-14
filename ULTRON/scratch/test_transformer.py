import sys
sys.path.insert(0, '.')
import autonomous_transformer

with open('projects/proj_20260911_132053_create_a_website_to_upload_pdf_a/index.html', 'r', encoding='utf-8') as f:
    sample_code = f.read()

res_code, res_summary = autonomous_transformer.transform_application_code(sample_code, 'docx file created where is download button add it')
print('Summary:', res_summary)
print('Has btn-preview-download in transformed code:', 'btn-preview-download' in res_code)
print('Has id="previewMetaText" in sample_code:', 'id="previewMetaText"' in sample_code)
print('Has sheetImagesGrid in sample_code:', 'sheetImagesGrid' in sample_code)
print('Has ultron-floating-actions in res_code:', 'ultron-floating-actions' in res_code)
