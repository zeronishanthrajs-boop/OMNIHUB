# ════════════════════════════════════════
# FILE: skills/translator.py
# PURPOSE: Offline translation using Argos Translate.
# MODIFIES: Argos translation package cache
# ════════════════════════════════════════

SKILL_NAME = "translator"
SKILL_DESCRIPTION = "Translate text offline using installed Argos Translate models."
SKILL_PARAMETERS = {
    "type": "object",
    "properties": {"text": {"type": "string"}, "target_language": {"type": "string"}},
    "required": ["text", "target_language"],
}


def execute(text: str, target_language: str) -> str:
    try:
        import argostranslate.package
        import argostranslate.translate

        installed = argostranslate.translate.get_installed_languages()
        if not installed:
            argostranslate.package.update_package_index()
            return "Translation model is not installed yet. Downloading translation model; try again after setup completes."
        source = next((lang for lang in installed if lang.code.startswith("en")), installed[0])
        target = next((lang for lang in installed if target_language.lower() in (lang.name.lower(), lang.code.lower())), None)
        if not target:
            return f"No offline translation model installed for {target_language}."
        translation = source.get_translation(target)
        return translation.translate(text)
    except Exception as exc:
        return f"Translation failed: {exc}"

