#!/usr/bin/env python
# -*- coding: utf-8 -*-
import pdfplumber
import sys

pdf_path = r'c:\Users\Administrator.DESKTOP-OL9EUP2\Desktop\1\10.普通本科毕业论文（设计）开题报告书（英模板）.pdf'
output_path = r'c:\Users\Administrator.DESKTOP-OL9EUP2\Desktop\1\thesis_content.txt'

try:
    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for i, page in enumerate(pdf.pages):
            full_text += f"\n--- Page {i+1} ---\n"
            text = page.extract_text()
            if text:
                full_text += text
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(full_text)
        
        print(f"Extracted {len(pdf.pages)} pages successfully")
        print(full_text[:2000])
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
