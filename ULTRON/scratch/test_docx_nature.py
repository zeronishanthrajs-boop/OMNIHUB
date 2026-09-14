import docx
import traceback

fake_docx = b"""<html xmlns:w="urn:schemas-microsoft-com:office:word"><head></head><body><h1>Converted Image Document</h1></body></html>"""
with open("scratch/test_fake.docx", "wb") as f:
    f.write(fake_docx)

try:
    doc = docx.Document("scratch/test_fake.docx")
    for p in doc.paragraphs:
        print("Paragraph:", p.text)
except Exception as e:
    print("Exception when opening as docx:")
    traceback.print_exc()
