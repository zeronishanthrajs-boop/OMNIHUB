from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, PageBreak, HRFlowable, KeepTogether)
from reportlab.platypus.flowables import Flowable
from reportlab.lib.colors import HexColor
from pathlib import Path
import textwrap

# ── Colour Palette ──────────────────────────────────────────────────────────
C_BG_DARK   = HexColor("#0D1117")
C_ACCENT    = HexColor("#58A6FF")
C_ACCENT2   = HexColor("#F78166")
C_GREEN     = HexColor("#3FB950")
C_YELLOW    = HexColor("#D29922")
C_PURPLE    = HexColor("#BC8CFF")
C_CARD_BG   = HexColor("#161B22")
C_BORDER    = HexColor("#30363D")
C_TEXT      = HexColor("#E6EDF3")
C_MUTED     = HexColor("#8B949E")
C_WHITE     = HexColor("#FFFFFF")
C_CRITICAL  = HexColor("#DA3633")
C_INSIGHT   = HexColor("#1F6FEB")
C_DEEPDIVE  = HexColor("#388BFD")
C_CRITICAL_BG = HexColor("#3D1A1A")
C_INSIGHT_BG  = HexColor("#1A2D4A")
C_DEEPDIVE_BG = HexColor("#1A2A3A")
C_SECTION_A = HexColor("#1E3A5F")
C_SECTION_B = HexColor("#3D2B00")
C_SECTION_C = HexColor("#3D0A0A")

W, H = A4

# ── Custom Flowables ─────────────────────────────────────────────────────────
class ColorRect(Flowable):
    def __init__(self, w, h, fill, radius=4):
        self.w, self.h, self.fill, self.radius = w, h, fill, radius
    def draw(self):
        self.canv.setFillColor(self.fill)
        self.canv.roundRect(0, 0, self.w, self.h, self.radius, fill=1, stroke=0)
    def wrap(self, *args): return self.w, self.h

class SideBarPara(Flowable):
    """Paragraph with a coloured left bar."""
    def __init__(self, text, bar_color, bg_color, style, padding=8):
        self.text = text
        self.bar_color = bar_color
        self.bg_color = bg_color
        self.style = style
        self.padding = padding
        self._para = None
        self._width = 0

    def wrap(self, availWidth, availHeight):
        self._width = availWidth
        inner_w = availWidth - 6 - self.padding * 2
        self._para = Paragraph(self.text, self.style)
        pw, ph = self._para.wrap(inner_w, availHeight)
        self._height = ph + self.padding * 2
        return availWidth, self._height

    def draw(self):
        c = self.canv
        c.setFillColor(self.bg_color)
        c.roundRect(0, 0, self._width, self._height, 4, fill=1, stroke=0)
        c.setFillColor(self.bar_color)
        c.rect(0, 0, 5, self._height, fill=1, stroke=0)
        self._para.drawOn(c, 6 + self.padding, self.padding)

# ── Style Sheet ───────────────────────────────────────────────────────────────
def make_styles():
    base = getSampleStyleSheet()
    def ps(name, **kw):
        return ParagraphStyle(name, **kw)

    return {
        'cover_title': ps('ct', fontName='Helvetica-Bold', fontSize=32,
                          textColor=C_WHITE, leading=40, alignment=TA_CENTER,
                          spaceAfter=6),
        'cover_sub':   ps('cs', fontName='Helvetica', fontSize=14,
                          textColor=C_ACCENT, leading=18, alignment=TA_CENTER,
                          spaceAfter=4),
        'cover_meta':  ps('cm', fontName='Helvetica', fontSize=11,
                          textColor=C_MUTED, leading=15, alignment=TA_CENTER),
        'h1':  ps('h1', fontName='Helvetica-Bold', fontSize=22,
                  textColor=C_ACCENT, leading=28, spaceBefore=14, spaceAfter=6),
        'h2':  ps('h2', fontName='Helvetica-Bold', fontSize=16,
                  textColor=C_GREEN, leading=22, spaceBefore=10, spaceAfter=4),
        'h3':  ps('h3', fontName='Helvetica-Bold', fontSize=13,
                  textColor=C_YELLOW, leading=17, spaceBefore=8, spaceAfter=3),
        'body': ps('body', fontName='Helvetica', fontSize=10,
                   textColor=C_TEXT, leading=15, spaceAfter=4, alignment=TA_JUSTIFY),
        'body_b': ps('body_b', fontName='Helvetica-Bold', fontSize=10,
                     textColor=C_TEXT, leading=15, spaceAfter=4),
        'bullet': ps('bullet', fontName='Helvetica', fontSize=10,
                     textColor=C_TEXT, leading=14, leftIndent=14,
                     bulletIndent=4, spaceAfter=2),
        'bullet2': ps('bullet2', fontName='Helvetica', fontSize=9.5,
                      textColor=C_MUTED, leading=13, leftIndent=28,
                      bulletIndent=18, spaceAfter=2),
        'code':  ps('code', fontName='Courier', fontSize=9,
                    textColor=C_GREEN, leading=13, leftIndent=10,
                    backColor=HexColor("#0D1117"), spaceAfter=2),
        'tag_critical': ps('tc', fontName='Helvetica-Bold', fontSize=10,
                           textColor=C_CRITICAL, leading=14),
        'tag_insight':  ps('ti', fontName='Helvetica-Bold', fontSize=10,
                           textColor=C_ACCENT, leading=14),
        'tag_deep':     ps('td', fontName='Helvetica-Bold', fontSize=10,
                           textColor=C_PURPLE, leading=14),
        'callout_body': ps('cb', fontName='Helvetica', fontSize=9.5,
                           textColor=C_TEXT, leading=14),
        'table_h': ps('th', fontName='Helvetica-Bold', fontSize=9,
                      textColor=C_WHITE, leading=12, alignment=TA_CENTER),
        'table_b': ps('tb', fontName='Helvetica', fontSize=9,
                      textColor=C_TEXT, leading=12, alignment=TA_LEFT),
        'section_badge': ps('sb', fontName='Helvetica-Bold', fontSize=11,
                            textColor=C_WHITE, leading=14, alignment=TA_CENTER),
        'truth_h': ps('trh', fontName='Helvetica-Bold', fontSize=9,
                      textColor=C_ACCENT, leading=12, alignment=TA_CENTER),
        'truth_b': ps('trb', fontName='Courier', fontSize=9,
                      textColor=C_GREEN, leading=12, alignment=TA_CENTER),
        'takeaway': ps('take', fontName='Helvetica-BoldOblique', fontSize=10.5,
                       textColor=C_YELLOW, leading=15, spaceAfter=6),
        'muted': ps('muted', fontName='Helvetica', fontSize=9,
                    textColor=C_MUTED, leading=13),
    }

S = make_styles()

# ── Helper builders ───────────────────────────────────────────────────────────
def spacer(h=6): return Spacer(1, h)
def hr(): return HRFlowable(width="100%", thickness=0.5, color=C_BORDER, spaceAfter=6)

def h1(t): return Paragraph(t, S['h1'])
def h2(t): return Paragraph(t, S['h2'])
def h3(t): return Paragraph(t, S['h3'])
def body(t): return Paragraph(t, S['body'])
def bold(t): return Paragraph(t, S['body_b'])
def bullet(t, lvl=1):
    st = S['bullet'] if lvl == 1 else S['bullet2']
    return Paragraph(f"&#8226; {t}", st)
def takeaway(t): return Paragraph(f"&#9654; {t}", S['takeaway'])
def muted(t): return Paragraph(t, S['muted'])

def callout(tag, label, text):
    if tag == 'CRITICAL':
        bc, bg, ts = C_CRITICAL, C_CRITICAL_BG, S['tag_critical']
    elif tag == 'INSIGHT':
        bc, bg, ts = C_ACCENT, C_INSIGHT_BG, S['tag_insight']
    else:
        bc, bg, ts = C_PURPLE, C_DEEPDIVE_BG, S['tag_deep']
    content = f"<b>[{label}]</b>  {text}"
    return SideBarPara(content, bc, bg, S['callout_body'], padding=8)

def mk_table(headers, rows, col_widths=None):
    th = [Paragraph(h, S['table_h']) for h in headers]
    data = [th]
    for r in rows:
        data.append([Paragraph(str(c), S['table_b']) for c in r])
    cw = col_widths or [(W - 80) / len(headers)] * len(headers)
    t = Table(data, colWidths=cw, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_ACCENT),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [C_CARD_BG, C_BG_DARK]),
        ('GRID', (0,0), (-1,-1), 0.4, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    return t

def truth_table(headers, rows):
    th = [Paragraph(h, S['truth_h']) for h in headers]
    data = [th]
    for r in rows:
        data.append([Paragraph(str(c), S['truth_b']) for c in r])
    cw = [30*mm] * len(headers)
    t = Table(data, colWidths=cw, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HexColor("#1A3A2A")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor("#0D1F17"), HexColor("#0D1117")]),
        ('GRID', (0,0), (-1,-1), 0.5, C_GREEN),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    return t

def section_header(letter, label, color, marks_info):
    data = [[
        Paragraph(f"SECTION {letter}", S['section_badge']),
        Paragraph(label, S['section_badge']),
        Paragraph(marks_info, S['section_badge']),
    ]]
    t = Table(data, colWidths=[50*mm, 80*mm, 50*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), color),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [6,6,6,6]),
    ]))
    return t

# ═══════════════════════════════════════════════════════════════════════════════
# CONTENT BUILDERS
# ═══════════════════════════════════════════════════════════════════════════════

def cover_page(story):
    story.append(spacer(40))
    story.append(Paragraph("DCCA201", S['cover_title']))
    story.append(Paragraph("Computer Architecture", S['cover_sub']))
    story.append(spacer(8))
    story.append(HRFlowable(width="60%", thickness=2, color=C_ACCENT,
                             hAlign='CENTER', spaceAfter=10))
    story.append(Paragraph("Hyper-Structured Exam Master Notes", S['cover_sub']))
    story.append(spacer(6))
    story.append(Paragraph("II Semester BCA — NEP Scheme | June/July 2025 Paper Analysis",
                            S['cover_meta']))
    story.append(Paragraph("Max Marks: 60  |  Time: 2½ Hours  |  All Sections Covered",
                            S['cover_meta']))
    story.append(spacer(20))

    # Stats table
    data = [
        [Paragraph("SECTION A", S['table_h']),
         Paragraph("SECTION B", S['table_h']),
         Paragraph("SECTION C", S['table_h'])],
        [Paragraph("2 Marks × 4 = 8", S['table_b']),
         Paragraph("5 Marks × 4 = 20", S['table_b']),
         Paragraph("8 Marks × 4 = 32", S['table_b'])],
        [Paragraph("Answer ANY 4 of 6", S['table_b']),
         Paragraph("Answer ANY 4 of 6", S['table_b']),
         Paragraph("Answer ANY 4 of 6", S['table_b'])],
    ]
    t = Table(data, colWidths=[55*mm, 55*mm, 55*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_ACCENT),
        ('BACKGROUND', (0,1), (0,-1), C_SECTION_A),
        ('BACKGROUND', (1,1), (1,-1), C_SECTION_B),
        ('BACKGROUND', (2,1), (2,-1), C_SECTION_C),
        ('GRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(PageBreak())


def toc_page(story):
    story.append(h1("TABLE OF CONTENTS"))
    story.append(hr())
    toc = [
        ("SECTION A — 2 Mark Questions", "18 topics, all definitions & short answers"),
        ("  1. Computer Architecture", "Definition + components"),
        ("  2. Bit & Byte", "Units + examples"),
        ("  3. Op-code & Operand", "Instruction format"),
        ("  4. Micro Operation", "Types + examples"),
        ("  5. Cache Memory", "Levels + working"),
        ("  6. Peripheral Devices", "4 examples"),
        ("  7. Gray Code Conversion", "Binary → Gray method"),
        ("  8. Number Conversions", "Binary, Octal, Decimal, Hex"),
        ("  9. De Morgan's Theorem", "Both laws + proof"),
        ("  10. Flip-Flop", "Types + definitions"),
        ("  11. SRAM vs DRAM", "Comparison table"),
        ("  12. Computer Registers", "All 8 registers"),
        ("  13. IC & Types", "SSI/MSI/LSI/VLSI"),
        ("  14. Hit Ratio", "Formula + meaning"),
        ("  15. MIMD", "Flynn's taxonomy"),
        ("  16. NOR / NOT Gate", "Symbol + truth table"),
        ("  17. Control Inputs", "3 register control signals"),
        ("  18. Multiprocessor Characteristics", "Key traits"),
        ("SECTION B — 5 Mark Questions", "10 topics, medium depth"),
        ("  19. K-Map Simplification", "4-variable, SOP method"),
        ("  20. 4-to-1 Multiplexer", "Circuit + truth table"),
        ("  21. Half Adder & Full Adder", "Logic + truth tables"),
        ("  22. BUN & BSA Instructions", "Branch instructions"),
        ("  23. CISC vs RISC", "Detailed comparison"),
        ("  24. Associative Memory", "CAM architecture"),
        ("  25. ILP & Limitations", "Instruction-level parallelism"),
        ("  26. Binary Codes", "Gray, BCD, ASCII"),
        ("  27. Arithmetic Micro-operations", "ADD, SUB, INC, DEC"),
        ("  28. 3-to-8 Line Decoder", "Truth table + logic"),
        ("SECTION C — 8 Mark Questions", "15 topics, full depth"),
        ("  29. SR Flip-Flop", "NOR/NAND construction, truth table"),
        ("  30. DMA Controller", "Block diagram, working"),
        ("  31. 3×8 Line Decoder", "Full diagram + truth table"),
        ("  32. Instruction Cycle", "All phases + flowchart"),
        ("  33. Addressing Modes", "5 modes with examples"),
        ("  34. Multithreaded Architecture", "Fine/coarse-grained"),
        ("  35. Shift Registers", "SIPO, PISO, parallel load"),
        ("  36. Register-Reference Instructions", "All 12 operations"),
        ("  37. Cross-bar & Multi-stage Switch", "Network topology"),
        ("  38. CPU Organization", "Single/multiple bus"),
        ("  39. Full Adder (detailed)", "Circuit + Boolean"),
        ("  40. De Morgan's Theorem (proof)", "Set theory proof"),
        ("  41. CISC vs RISC (8-mark)", "Extended comparison"),
        ("  42. I/O Interface Unit", "Interface architecture"),
        ("  43. Multiprocessor vs Multicomputer", "Architecture diff"),
    ]
    for title, desc in toc:
        if title.startswith("SECTION"):
            story.append(spacer(6))
            story.append(bold(f"▶  {title}"))
            story.append(muted(f"   {desc}"))
            story.append(spacer(2))
        else:
            story.append(Paragraph(
                f"<font color='#{C_ACCENT.hexval()[2:]}'>{'&nbsp;'*4}{title}</font>"
                f"<font color='#{C_MUTED.hexval()[2:]}'> — {desc}</font>",
                S['body']))
    story.append(PageBreak())


# ─── SECTION A ────────────────────────────────────────────────────────────────
def section_a(story):
    story.append(section_header("A", "Short Answer Questions", C_SECTION_A,
                                 "2 Marks Each | Answer ANY 4 of 6"))
    story.append(spacer(8))

    # Q1 Computer Architecture
    story.append(KeepTogether([
        h2("Q1. Define Computer Architecture"),
        takeaway("CA defines the functional behaviour of a computer system as seen by the programmer."),
        body("Computer Architecture describes the <b>logical structure and functional characteristics</b> of a computer, including the instruction set, data formats, addressing modes, and I/O mechanisms. It operates at the interface between hardware and software."),
        spacer(4),
        bold("Core Components:"),
        bullet("<b>Instruction Set Architecture (ISA):</b> The set of instructions the CPU can execute (e.g., ADD, LOAD, JUMP)."),
        bullet("<b>Microarchitecture:</b> The physical implementation of the ISA — pipeline stages, cache hierarchy, branch prediction."),
        bullet("<b>System Architecture:</b> Memory subsystem, I/O buses, interrupt handling, and multiprocessor interconnects."),
        spacer(4),
        mk_table(
            ["Level", "Focus", "Example"],
            [["ISA", "Programmer-visible operations", "x86, ARM, MIPS instruction sets"],
             ["Microarchitecture", "Hardware execution details", "Pipeline depth, cache size"],
             ["System Design", "Component integration", "Bus width, memory hierarchy"],
             ["Logic Design", "Gate-level implementation", "ALU using NAND gates"]],
            [45*mm, 65*mm, 60*mm]
        ),
        spacer(4),
        callout("INSIGHT", "INSIGHT", "Architecture is WHAT the computer does; Organisation is HOW it does it. This distinction is a frequent 2-mark trap question."),
    ]))
    story.append(spacer(8))

    # Q2 Bit and Byte
    story.append(KeepTogether([
        h2("Q2. What is Bit and Byte?"),
        takeaway("A bit is the atomic unit of digital information; a byte is the practical addressable unit."),
        body("<b>Bit (Binary Digit):</b> The smallest unit of data in computing, representing one of two states — 0 (off/false) or 1 (on/true). All digital data is ultimately stored and processed as combinations of bits."),
        body("<b>Byte:</b> A group of <b>8 bits</b>. A byte can represent 2<super>8</super> = 256 distinct values (0–255). It is the standard addressable unit of memory in most architectures."),
        spacer(4),
        mk_table(
            ["Unit", "Size", "Range / Example"],
            [["Bit", "1 bit", "0 or 1"],
             ["Nibble", "4 bits", "0000 to 1111 (0–15)"],
             ["Byte", "8 bits", "00000000 to 11111111 (0–255)"],
             ["Kilobyte (KB)", "1024 bytes", "~1000 characters of text"],
             ["Megabyte (MB)", "1024 KB", "~1 million characters"],
             ["Gigabyte (GB)", "1024 MB", "~1 billion characters"]],
            [45*mm, 40*mm, 85*mm]
        ),
        callout("INSIGHT", "EXAMPLE", "The letter 'A' is stored as the byte 01000001 (ASCII value 65). Each pixel in an image may use 3 bytes (RGB)."),
    ]))
    story.append(spacer(8))

    # Q3 Opcode and Operand
    story.append(KeepTogether([
        h2("Q3. Define Op-code and Operand"),
        takeaway("Every machine instruction is split into WHAT to do (opcode) and WHAT to do it on (operand)."),
        body("A machine instruction has two fundamental fields:"),
        bullet("<b>Op-code (Operation Code):</b> The portion of the instruction that specifies the operation to be performed. Examples: ADD (addition), SUB (subtraction), LOAD (fetch from memory), JUMP (branch). In a 16-bit instruction, the opcode may occupy the upper 4 bits, allowing 2<super>4</super> = 16 distinct operations."),
        bullet("<b>Operand:</b> The data value or address on which the operation acts. Can be an immediate value, a register reference, or a memory address."),
        spacer(4),
        bold("Instruction Format Example (16-bit):"),
        Paragraph("<font name='Courier' color='#3FB950'>| 0010 | 0000 0000 0110 |</font>", S['body']),
        Paragraph("<font name='Courier' color='#8B949E'>  ^OP    ^--- Operand (memory address 6) ---^</font>", S['body']),
        Paragraph("<font name='Courier' color='#8B949E'>  ADD</font>", S['body']),
        spacer(4),
        callout("CRITICAL", "EXAM TRAP", "The opcode does NOT contain data — it contains the operation identifier. The operand may itself be an address (indirect) or value (immediate). Know the difference."),
    ]))
    story.append(spacer(8))

    # Q4 Micro Operation
    story.append(KeepTogether([
        h2("Q4. Define Micro Operation"),
        takeaway("Micro-operations are the atomic hardware-level actions that collectively implement one machine instruction."),
        body("A <b>Micro-operation</b> is a fundamental, indivisible operation performed by the CPU's control unit during one clock cycle. A single machine instruction decomposes into a sequence of micro-operations executed on registers, the ALU, or memory buses."),
        spacer(4),
        bold("Four Classes of Micro-operations:"),
        mk_table(
            ["Class", "Operation", "Example"],
            [["Register Transfer", "Copy data between registers", "R1 ← R2"],
             ["Arithmetic", "Math on register contents", "R3 ← R1 + R2"],
             ["Logic", "Bitwise operations", "R1 ← R1 AND R2"],
             ["Shift", "Shift register contents", "R1 ← shl R1 (left shift)"]],
            [50*mm, 65*mm, 55*mm]
        ),
        callout("DEEP-DIVE", "DEEP-DIVE", "During FETCH phase: PC → MAR (transfer), M[MAR] → MDR (memory read), MDR → IR (register transfer), PC ← PC+1 (arithmetic). These are all micro-operations of the single FETCH instruction."),
    ]))
    story.append(spacer(8))

    # Q5 Cache Memory
    story.append(KeepTogether([
        h2("Q5. Define Cache Memory"),
        takeaway("Cache memory eliminates the speed mismatch between fast CPU and slow main memory by storing frequently used data close to the processor."),
        body("Cache memory is a <b>small, high-speed volatile memory</b> located between the CPU and main RAM. It exploits the <b>principle of locality</b> — the observation that programs tend to access the same memory locations repeatedly (temporal locality) or nearby locations (spatial locality)."),
        spacer(4),
        mk_table(
            ["Cache Level", "Location", "Size", "Speed", "Purpose"],
            [["L1", "Inside CPU core", "32–256 KB", "~1 ns", "Fastest; instruction + data"],
             ["L2", "On CPU die", "256 KB – 4 MB", "~5 ns", "Bridge L1 and L3"],
             ["L3", "Shared across cores", "4 – 64 MB", "~20 ns", "Last cache before RAM"]],
            [25*mm, 38*mm, 35*mm, 25*mm, 47*mm]
        ),
        spacer(4),
        bold("Hit Ratio Formula:"),
        Paragraph("<font name='Courier' color='#3FB950'>Hit Ratio (h) = Cache Hits / (Cache Hits + Cache Misses)</font>", S['body']),
        Paragraph("<font name='Courier' color='#3FB950'>Avg Access Time = h × Tc + (1-h) × Tm</font>", S['body']),
        Paragraph("<font name='Courier' color='#8B949E'>where Tc = cache access time, Tm = main memory access time</font>", S['body']),
        callout("INSIGHT", "INSIGHT", "A hit ratio of 0.9 means 90% of memory accesses are served from cache. Modern CPUs achieve >95% L1 hit rates on typical workloads."),
    ]))
    story.append(spacer(8))

    # Q6 Peripheral Devices
    story.append(KeepTogether([
        h2("Q6. Write Any Four Peripheral Devices"),
        takeaway("Peripheral devices extend the core computing system with input, output, and storage capabilities."),
        mk_table(
            ["Device", "Category", "Function", "Interface"],
            [["Keyboard", "Input", "Converts keystrokes to ASCII codes sent to CPU", "USB / PS2"],
             ["Mouse", "Input", "Translates physical movement to pointer coordinates", "USB / Bluetooth"],
             ["Printer", "Output", "Renders digital data as physical hard-copy output", "USB / LAN"],
             ["Hard Disk Drive", "Storage (I/O)", "Persistent magnetic storage of programs and data", "SATA / NVMe"],
             ["Monitor", "Output", "Renders framebuffer pixel data as visible image", "HDMI / VGA"],
             ["Scanner", "Input", "Converts physical documents to digital bitmap images", "USB"]],
            [35*mm, 28*mm, 70*mm, 37*mm]
        ),
    ]))
    story.append(spacer(8))

    # Q7 Gray Code Conversion
    story.append(KeepTogether([
        h2("Q7. Convert Binary to Gray Code"),
        takeaway("Gray code changes only ONE bit between consecutive values — critical for eliminating transition errors in digital systems."),
        bold("Conversion Rule: Binary → Gray"),
        bullet("MSB of Gray code = MSB of Binary (unchanged)."),
        bullet("Each subsequent Gray bit = XOR of current Binary bit with previous Binary bit."),
        bullet("Formula: G[i] = B[i] XOR B[i-1]"),
        spacer(4),
        bold("Worked Example: Convert (11011)<sub>2</sub> to Gray Code"),
        Paragraph("<font name='Courier' color='#3FB950'>Binary:  1  1  0  1  1</font>", S['body']),
        Paragraph("<font name='Courier' color='#58A6FF'>Step 1:  1  (MSB, copied directly)</font>", S['body']),
        Paragraph("<font name='Courier' color='#58A6FF'>Step 2:  1 XOR 1 = 0</font>", S['body']),
        Paragraph("<font name='Courier' color='#58A6FF'>Step 3:  1 XOR 0 = 1</font>", S['body']),
        Paragraph("<font name='Courier' color='#58A6FF'>Step 4:  0 XOR 1 = 1</font>", S['body']),
        Paragraph("<font name='Courier' color='#58A6FF'>Step 5:  1 XOR 1 = 0</font>", S['body']),
        Paragraph("<font name='Courier' color='#F78166'>Result:  1  0  1  1  0  (Gray Code)</font>", S['body']),
        spacer(4),
        truth_table(
            ["Decimal", "Binary", "Gray Code"],
            [["0","0000","0000"],["1","0001","0001"],["2","0010","0011"],
             ["3","0011","0010"],["4","0100","0110"],["5","0101","0111"],
             ["6","0110","0101"],["7","0111","0100"]]
        ),
        callout("CRITICAL", "EXAM TRAP", "Gray code is NOT BCD. Gray code has only 1-bit difference between adjacent values. BCD encodes each decimal digit in 4 binary bits independently."),
    ]))
    story.append(spacer(8))

    # Q8 Number Conversions
    story.append(KeepTogether([
        h2("Q8. Number System Conversions"),
        takeaway("Master the conversion chain: Decimal ↔ Binary ↔ Octal ↔ Hex — these appear every semester."),
        bold("Example: Convert (642)<sub>10</sub> to Binary"),
        Paragraph("<font name='Courier' color='#3FB950'>642 ÷ 2 = 321 R 0</font>", S['body']),
        Paragraph("<font name='Courier' color='#3FB950'>321 ÷ 2 = 160 R 1</font>", S['body']),
        Paragraph("<font name='Courier' color='#3FB950'>160 ÷ 2 = 80  R 0</font>", S['body']),
        Paragraph("<font name='Courier' color='#3FB950'>80  ÷ 2 = 40  R 0</font>", S['body']),
        Paragraph("<font name='Courier' color='#3FB950'>40  ÷ 2 = 20  R 0</font>", S['body']),
        Paragraph("<font name='Courier' color='#3FB950'>20  ÷ 2 = 10  R 0</font>", S['body']),
        Paragraph("<font name='Courier' color='#3FB950'>10  ÷ 2 = 5   R 0</font>", S['body']),
        Paragraph("<font name='Courier' color='#3FB950'>5   ÷ 2 = 2   R 1</font>", S['body']),
        Paragraph("<font name='Courier' color='#3FB950'>2   ÷ 2 = 1   R 0</font>", S['body']),
        Paragraph("<font name='Courier' color='#3FB950'>1   ÷ 2 = 0   R 1</font>", S['body']),
        Paragraph("<font name='Courier' color='#F78166'>Read remainders bottom-up: (1010000010)<sub>2</sub></font>", S['body']),
        spacer(6),
        bold("Example: Convert (11011)<sub>2</sub> to Gray Code → (10110)<sub>Gray</sub>"),
        bold("Example: Convert (11011<sub>2</sub>) to Octal"),
        Paragraph("<font name='Courier' color='#3FB950'>Group in 3s from right: 011 011</font>", S['body']),
        Paragraph("<font name='Courier' color='#3FB950'>011 = 3,  011 = 3  →  (33)<sub>8</sub></font>", S['body']),
    ]))
    story.append(spacer(8))

    # Q9 De Morgan's Theorem
    story.append(KeepTogether([
        h2("Q9. State De Morgan's Theorem"),
        takeaway("De Morgan's laws are the foundation of logic gate equivalence and Boolean simplification."),
        bold("First Law:  (A + B)' = A' . B'"),
        body("The complement of a sum equals the product of the complements. A NOR gate is equivalent to an AND gate with inverted inputs."),
        bold("Second Law:  (A . B)' = A' + B'"),
        body("The complement of a product equals the sum of the complements. A NAND gate is equivalent to an OR gate with inverted inputs."),
        spacer(4),
        truth_table(
            ["A", "B", "(A+B)'", "A'.B'", "Match?"],
            [["0","0","1","1","YES"],
             ["0","1","0","0","YES"],
             ["1","0","0","0","YES"],
             ["1","1","0","0","YES"]]
        ),
        callout("INSIGHT", "APPLICATION", "De Morgan's theorem is used to convert NAND-NAND networks to SOP expressions and NOR-NOR networks to POS expressions — essential for K-Map simplification."),
    ]))
    story.append(spacer(8))

    # Q10 Flip-Flop
    story.append(KeepTogether([
        h2("Q10. Define Flip-Flop and Its Types"),
        takeaway("A flip-flop is a 1-bit memory cell — the building block of registers, counters, and sequential logic."),
        body("A <b>flip-flop</b> is a bistable multivibrator — a sequential logic circuit that stores one bit of information and can hold either state (0 or 1) indefinitely until a clock edge triggers a state change."),
        spacer(4),
        mk_table(
            ["Type", "Inputs", "Key Characteristic", "Application"],
            [["SR Flip-Flop", "S, R", "Set/Reset; forbidden state S=R=1", "Basic memory cell"],
             ["D Flip-Flop", "D", "Output follows D at clock edge", "Data registers, shift registers"],
             ["JK Flip-Flop", "J, K", "No invalid state; J=K=1 toggles", "Counters, universal FF"],
             ["T Flip-Flop", "T", "Toggles when T=1", "Binary counters, frequency division"]],
            [30*mm, 22*mm, 70*mm, 48*mm]
        ),
    ]))
    story.append(spacer(8))

    # Q11 SRAM vs DRAM
    story.append(KeepTogether([
        h2("Q11. What is Static RAM and Dynamic RAM?"),
        takeaway("SRAM is faster and costlier (used for cache); DRAM is denser and cheaper (used for main memory)."),
        mk_table(
            ["Feature", "SRAM", "DRAM"],
            [["Storage element", "Flip-flop (6 transistors)", "Capacitor + 1 transistor"],
             ["Refresh needed", "No", "Yes — every ~64 ms"],
             ["Speed", "Very fast (~1 ns)", "Slower (~10–50 ns)"],
             ["Density", "Low (less bits/chip)", "High (GB per chip)"],
             ["Power", "Higher static power", "Lower — power only when refreshing"],
             ["Cost", "Expensive", "Cheap"],
             ["Usage", "L1/L2/L3 Cache", "Main memory (RAM modules)"]],
            [50*mm, 65*mm, 55*mm]
        ),
        callout("DEEP-DIVE", "DEEP-DIVE", "DRAM capacitors leak charge over time. The memory controller must periodically read and rewrite (refresh) each row to prevent data loss. This refresh cycle causes DRAM to stall CPU access for ~5% of the time."),
    ]))
    story.append(spacer(8))

    # Q12 Registers
    story.append(KeepTogether([
        h2("Q12. List Basic Computer Registers and Functions"),
        takeaway("The 8 basic registers form the operational core of the CPU — together they implement the fetch-decode-execute cycle."),
        mk_table(
            ["Register", "Full Name", "Bits", "Function"],
            [["PC", "Program Counter", "12", "Holds address of NEXT instruction to fetch"],
             ["AR", "Address Register", "12", "Holds memory address for current operation"],
             ["DR", "Data Register", "16", "Holds data read from / to be written to memory"],
             ["AC", "Accumulator", "16", "General-purpose register; holds ALU results"],
             ["IR", "Instruction Register", "16", "Holds currently executing instruction"],
             ["TR", "Temporary Register", "16", "Temporary storage during multi-step operations"],
             ["INPR", "Input Register", "8", "Holds character received from input device"],
             ["OUTR", "Output Register", "8", "Holds character to be sent to output device"]],
            [20*mm, 45*mm, 20*mm, 85*mm]
        ),
    ]))
    story.append(spacer(8))

    # Q13 IC
    story.append(KeepTogether([
        h2("Q13. What is IC? Write Its Types"),
        takeaway("ICs revolutionised computing by shrinking entire circuits onto a single silicon chip."),
        body("An <b>Integrated Circuit (IC)</b> is a miniaturised electronic circuit fabricated on a single semiconductor wafer (silicon chip). Thousands to billions of transistors, resistors, and capacitors are embedded on a chip area smaller than a fingernail."),
        spacer(4),
        mk_table(
            ["Type", "Full Form", "Components per Chip", "Example"],
            [["SSI", "Small Scale Integration", "1–10 gates", "74xx logic gates"],
             ["MSI", "Medium Scale Integration", "10–100 gates", "Multiplexers, decoders"],
             ["LSI", "Large Scale Integration", "100–10,000 gates", "8-bit microprocessors"],
             ["VLSI", "Very Large Scale Integration", "10K–1M gates", "32/64-bit CPUs, GPUs"],
             ["ULSI", "Ultra Large Scale Integration", ">1 Million gates", "Modern Intel/AMD CPUs"]],
            [18*mm, 50*mm, 45*mm, 57*mm]
        ),
    ]))
    story.append(spacer(8))

    # Q14 Hit Ratio
    story.append(KeepTogether([
        h2("Q14. Define Hit Ratio"),
        takeaway("Hit ratio quantifies how effectively the cache serves memory requests — higher is better."),
        body("<b>Hit Ratio (h)</b> is the fraction of total memory accesses that are successfully served from cache memory (cache hit), as opposed to requiring a slower main memory access (cache miss)."),
        spacer(4),
        Paragraph("<font name='Courier' color='#3FB950'>Hit Ratio (h) = Number of Cache Hits / Total Memory Accesses</font>", S['body']),
        Paragraph("<font name='Courier' color='#3FB950'>Miss Ratio  = 1 - h</font>", S['body']),
        Paragraph("<font name='Courier' color='#3FB950'>Avg Access Time (T_avg) = h * T_cache + (1-h) * T_main</font>", S['body']),
        spacer(4),
        bold("Numerical Example:"),
        body("Cache access time = 10 ns, Main memory = 100 ns, Hit ratio = 0.9"),
        Paragraph("<font name='Courier' color='#58A6FF'>T_avg = 0.9 × 10 + 0.1 × 100 = 9 + 10 = 19 ns</font>", S['body']),
    ]))
    story.append(spacer(8))

    # Q15 MIMD
    story.append(KeepTogether([
        h2("Q15. What is MIMD?"),
        takeaway("MIMD is the most common parallel computing model — it underlies multi-core CPUs and distributed clusters."),
        body("<b>MIMD (Multiple Instruction, Multiple Data)</b> is one of Flynn's four taxonomy categories for computer architectures. In MIMD systems, multiple processors simultaneously execute different instructions on different data streams, operating independently and asynchronously."),
        spacer(4),
        mk_table(
            ["Flynn's Category", "Instructions", "Data", "Example"],
            [["SISD", "Single", "Single", "Classic uniprocessor (old PC)"],
             ["SIMD", "Single", "Multiple", "GPU, vector processor, SSE instructions"],
             ["MISD", "Multiple", "Single", "Fault-tolerant systems (theoretical)"],
             ["MIMD", "Multiple", "Multiple", "Multi-core CPU, server clusters, cloud"]],
            [40*mm, 32*mm, 32*mm, 66*mm]
        ),
        callout("INSIGHT", "INSIGHT", "Modern multi-core processors (Intel Core i9, AMD Ryzen) are MIMD systems. Each core independently executes its own instruction stream on its own data."),
    ]))
    story.append(spacer(8))

    # Q16 NOR/NOT Gate
    story.append(KeepTogether([
        h2("Q16. NOR Gate and NOT Gate — Truth Tables"),
        takeaway("NOR is a universal gate — any logic function can be built using only NOR gates."),
        bold("NOT Gate (Inverter) — Single Input:"),
        truth_table(["Input A", "Output Y = A'"],
                    [["0","1"],["1","0"]]),
        spacer(6),
        bold("NOR Gate — Two Inputs (Y = (A+B)'):"),
        truth_table(["A", "B", "A+B", "Y=(A+B)'"],
                    [["0","0","0","1"],["0","1","1","0"],["1","0","1","0"],["1","1","1","0"]]),
        callout("CRITICAL", "KEY FACT", "NOR and NAND are called universal gates because any Boolean function can be implemented using only NOR gates or only NAND gates. This is exploited in CMOS manufacturing."),
    ]))
    story.append(spacer(8))

    # Q17 Control Inputs
    story.append(KeepTogether([
        h2("Q17. Three Control Inputs for Registers"),
        takeaway("Three control signals govern ALL data movement in and out of CPU registers."),
        mk_table(
            ["Control Input", "Signal Name", "Function", "Active State"],
            [["Load (LD)", "Write Enable", "Loads new data into the register from data bus", "High (1)"],
             ["Clear (CLR)", "Reset", "Asynchronously resets all register bits to 0", "High (1)"],
             ["Clock (CLK)", "Synchronise", "Triggers state change on rising or falling edge", "Edge-triggered"]],
            [35*mm, 35*mm, 75*mm, 25*mm]
        ),
    ]))
    story.append(spacer(8))

    # Q18 Multiprocessor Characteristics
    story.append(KeepTogether([
        h2("Q18. Two Characteristics of Multiprocessor"),
        takeaway("Multiprocessors share memory and OS, enabling true parallel execution of threads."),
        bullet("<b>Shared Memory:</b> All processors access a common, unified address space. Any processor can read or write any memory location. This enables low-latency inter-processor communication but requires synchronisation primitives (mutexes, semaphores) to prevent race conditions."),
        bullet("<b>Parallel Processing:</b> Multiple processors execute different tasks (or parts of the same task) simultaneously, reducing total execution time. Amdahl's Law limits the speedup achievable based on the serial fraction of the program."),
        bullet("<b>Scalability:</b> Additional processors can be added to improve throughput up to the limits of the memory bus bandwidth."),
        bullet("<b>Single OS Instance:</b> One operating system manages all processors and presents them as a single coherent system to user applications."),
    ]))
    story.append(PageBreak())


# ─── SECTION B ────────────────────────────────────────────────────────────────
def section_b(story):
    story.append(section_header("B", "Medium Answer Questions", C_SECTION_B,
                                 "5 Marks Each | Answer ANY 4 of 6"))
    story.append(spacer(8))

    # Q19 K-Map
    story.append(h2("Q19. K-Map Simplification (4-Variable)"))
    story.append(takeaway("K-Map is the fastest method to minimise Boolean expressions — always group in powers of 2."))
    story.append(bold("Standard Question: F(A,B,C,D) = Σm(1,3,7,11,15) + Σd(0,2,5)"))
    story.append(spacer(4))
    story.append(bold("K-Map Rules (NEVER violate):"))
    story.append(bullet("Groups must be of size 1, 2, 4, 8, or 16 (powers of 2)."))
    story.append(bullet("Groups must be rectangular (including wrap-around edges)."))
    story.append(bullet("Don't-care terms (d) can be included in groups if they help form larger groups."))
    story.append(bullet("Always form the LARGEST possible groups."))
    story.append(bullet("Cover every minterm at least once; a minterm can be in multiple groups."))
    story.append(spacer(4))
    story.append(bold("4-Variable K-Map Layout (Gray code ordering):"))
    kmap_data = [
        [Paragraph("AB\\CD", S['truth_h']),
         Paragraph("00", S['truth_h']),
         Paragraph("01", S['truth_h']),
         Paragraph("11", S['truth_h']),
         Paragraph("10", S['truth_h'])],
        [Paragraph("00", S['truth_h']),
         Paragraph("m0", S['truth_b']),
         Paragraph("m1", S['truth_b']),
         Paragraph("m3", S['truth_b']),
         Paragraph("m2", S['truth_b'])],
        [Paragraph("01", S['truth_h']),
         Paragraph("m4", S['truth_b']),
         Paragraph("m5", S['truth_b']),
         Paragraph("m7", S['truth_b']),
         Paragraph("m6", S['truth_b'])],
        [Paragraph("11", S['truth_h']),
         Paragraph("m12", S['truth_b']),
         Paragraph("m13", S['truth_b']),
         Paragraph("m15", S['truth_b']),
         Paragraph("m14", S['truth_b'])],
        [Paragraph("10", S['truth_h']),
         Paragraph("m8", S['truth_b']),
         Paragraph("m9", S['truth_b']),
         Paragraph("m11", S['truth_b']),
         Paragraph("m10", S['truth_b'])],
    ]
    kt = Table(kmap_data, colWidths=[25*mm]*5)
    kt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), HexColor("#1A2A3A")),
        ('BACKGROUND', (0,0), (-1,0), HexColor("#1A2A3A")),
        ('ROWBACKGROUNDS', (1,1), (-1,-1), [HexColor("#0D1F17"), HexColor("#0D1117")]),
        ('GRID', (0,0), (-1,-1), 0.5, C_GREEN),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(kt)
    story.append(spacer(4))
    story.append(bold("2025 Paper: Simplify F(A,B,C,D) = Σm(1,3,7,11,15) + Σd(0,2,5)"))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>Group 1: m1,m3,m7,m15,m11 — column CD=01,11 wrap → CD</font>", S['body']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>Group 2: m0,m2 (don't care) + m1,m3 → A'B'</font>", S['body']))
    story.append(Paragraph("<font name='Courier' color='#F78166'>Simplified: F = CD + A'B' (verify by substituting minterms)</font>", S['body']))
    story.append(callout("CRITICAL", "EXAM STRATEGY", "In the exam, first fill the K-map grid, circle the groups with different coloured pens, then write the simplified expression. Marks are awarded for both the map AND the expression."))
    story.append(spacer(10))

    # Q20 4-to-1 MUX
    story.append(h2("Q20. 4-to-1 Multiplexer"))
    story.append(takeaway("A multiplexer is a data selector — it routes one of N inputs to a single output based on select lines."))
    story.append(body("A <b>4-to-1 Multiplexer</b> has 4 data inputs (I0–I3), 2 select lines (S1, S0), and 1 output (Y). Based on the 2-bit select code, one of the four input lines is connected to the output."))
    story.append(spacer(4))
    story.append(bold("Boolean Expression:"))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>Y = S1'.S0'.I0 + S1'.S0.I1 + S1.S0'.I2 + S1.S0.I3</font>", S['body']))
    story.append(spacer(4))
    story.append(truth_table(
        ["S1", "S0", "Output Y"],
        [["0","0","I0 (Input 0 selected)"],
         ["0","1","I1 (Input 1 selected)"],
         ["1","0","I2 (Input 2 selected)"],
         ["1","1","I3 (Input 3 selected)"]]
    ))
    story.append(spacer(4))
    story.append(bold("Gate-Level Implementation:"))
    story.append(bullet("4 AND gates (each 3-input: one select pair + data input)"))
    story.append(bullet("2 NOT gates (to invert S1 and S0)"))
    story.append(bullet("1 four-input OR gate (combines all AND outputs)"))
    story.append(bullet("Total: 4+2+1 = 7 gates"))
    story.append(callout("INSIGHT", "APPLICATION", "Multiplexers implement any Boolean function. A 4-to-1 MUX with fixed select lines can implement any 2-variable function by wiring I0–I3 to the function's truth table column."))
    story.append(spacer(10))

    # Q21 Half and Full Adder
    story.append(h2("Q21. Half Adder and Full Adder"))
    story.append(takeaway("Half adder adds 2 bits; full adder adds 3 bits — full adders chain together to add multi-bit numbers."))
    story.append(bold("HALF ADDER — Adds two 1-bit numbers (A, B):"))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>Sum   (S) = A XOR B = A ⊕ B</font>", S['body']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>Carry (C) = A AND B = A · B</font>", S['body']))
    story.append(spacer(4))
    story.append(truth_table(
        ["A", "B", "Sum (S)", "Carry (C)"],
        [["0","0","0","0"],["0","1","1","0"],["1","0","1","0"],["1","1","0","1"]]
    ))
    story.append(spacer(6))
    story.append(bold("FULL ADDER — Adds three 1-bit numbers (A, B, Cin):"))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>Sum  (S)    = A XOR B XOR Cin</font>", S['body']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>Carry (Cout) = (A·B) + (B·Cin) + (A·Cin)</font>", S['body']))
    story.append(spacer(4))
    story.append(truth_table(
        ["A", "B", "Cin", "Sum", "Cout"],
        [["0","0","0","0","0"],["0","0","1","1","0"],["0","1","0","1","0"],
         ["0","1","1","0","1"],["1","0","0","1","0"],["1","0","1","0","1"],
         ["1","1","0","0","1"],["1","1","1","1","1"]]
    ))
    story.append(spacer(4))
    story.append(bold("Implementation: Full Adder = 2 Half Adders + 1 OR gate"))
    story.append(callout("INSIGHT", "KEY LINK", "A 4-bit ripple-carry adder is built by cascading 4 full adders: Cout of stage N feeds Cin of stage N+1. The carry 'ripples' through each stage."))
    story.append(spacer(10))

    # Q22 BUN and BSA
    story.append(h2("Q22. BUN and BSA Instructions"))
    story.append(takeaway("BUN and BSA are the two fundamental branch instructions in the basic computer — they implement loops and subroutines."))
    story.append(bold("BUN — Branch Unconditionally:"))
    story.append(body("BUN transfers program control to a specified address <b>unconditionally</b>, regardless of any condition flags. Equivalent to a GOTO statement."))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>Operation: PC ← AR</font>", S['body']))
    story.append(Paragraph("<font name='Courier' color='#8B949E'>Effect: Next instruction fetched from address in AR</font>", S['body']))
    story.append(spacer(6))
    story.append(bold("BSA — Branch and Save Address:"))
    story.append(body("BSA implements <b>subroutine call</b> functionality. It saves the return address at the branch address, then jumps to branch_address+1 to execute the subroutine."))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>Operation: M[AR] ← PC,  PC ← AR + 1</font>", S['body']))
    story.append(Paragraph("<font name='Courier' color='#8B949E'>Step 1: Save current PC (return address) into memory at AR</font>", S['body']))
    story.append(Paragraph("<font name='Courier' color='#8B949E'>Step 2: Jump to AR+1 (first instruction of subroutine)</font>", S['body']))
    story.append(Paragraph("<font name='Courier' color='#8B949E'>Return: BUN to saved address restores execution flow</font>", S['body']))
    story.append(callout("CRITICAL", "EXAM TRAP", "BSA stores the RETURN address at the branch address itself (memory[AR]), not at a stack. This is different from modern CALL instructions that use a stack. The subroutine starts at AR+1, not AR."))
    story.append(spacer(10))

    # Q23 CISC vs RISC (5-mark)
    story.append(h2("Q23. CISC vs RISC"))
    story.append(takeaway("CISC trades instruction complexity for code density; RISC trades simplicity for execution speed."))
    story.append(mk_table(
        ["Feature", "CISC", "RISC"],
        [["Full Form", "Complex Instruction Set Computer", "Reduced Instruction Set Computer"],
         ["Instruction Count", "Large (100–300+ instructions)", "Small (50–100 instructions)"],
         ["Instruction Length", "Variable (1–15 bytes in x86)", "Fixed (typically 32 bits)"],
         ["Execution Cycles", "Multiple cycles per instruction", "1 cycle per instruction (ideal)"],
         ["Memory Access", "Any instruction can access memory", "Only LOAD/STORE access memory"],
         ["Registers", "Fewer general-purpose registers", "Many general-purpose registers (32+)"],
         ["Pipeline", "Difficult to pipeline", "Highly pipelineable"],
         ["Compiler", "Simpler compiler design", "Complex compiler (optimisation heavy)"],
         ["Power", "Higher power consumption", "Lower power (used in mobile/ARM)"],
         ["Examples", "Intel x86, AMD64", "ARM, MIPS, RISC-V, SPARC"]],
        [50*mm, 67*mm, 53*mm]
    ))
    story.append(spacer(10))

    # Q24 Associative Memory
    story.append(h2("Q24. Associative Memory"))
    story.append(takeaway("Associative memory searches by content, not address — it's the hardware that makes cache lookup instantaneous."))
    story.append(body("Also called <b>Content Addressable Memory (CAM)</b>, associative memory performs a parallel search across ALL stored words simultaneously using a search key (argument). Instead of specifying an address, you specify partial content and the memory returns all matching entries."))
    story.append(spacer(4))
    story.append(bold("Structure:"))
    story.append(bullet("<b>Argument Register:</b> Holds the search key (what you're looking for)."))
    story.append(bullet("<b>Key Register (Mask):</b> Specifies which bits of the argument are relevant."))
    story.append(bullet("<b>Match Register:</b> Output — one bit per word, set to 1 if that word matches."))
    story.append(bullet("<b>Data Array:</b> Stores all words in parallel comparator cells."))
    story.append(spacer(4))
    story.append(bold("Applications:"))
    story.append(mk_table(
        ["Application", "How CAM is Used", "Benefit"],
        [["CPU Cache", "Tag matching for cache hit detection", "O(1) lookup vs O(n) search"],
         ["TLB (Virtual Memory)", "Virtual-to-physical address translation", "Single-cycle page table lookup"],
         ["Network Routing", "IP address matching in routers", "Line-rate packet forwarding"],
         ["Database", "Hash joins and key lookups", "Parallel search across all rows"]],
        [40*mm, 75*mm, 55*mm]
    ))
    story.append(spacer(10))

    # Q25 ILP
    story.append(h2("Q25. ILP — Instruction-Level Parallelism"))
    story.append(takeaway("ILP is the degree to which instructions in a program can be executed simultaneously — limited by data and control dependencies."))
    story.append(body("<b>Instruction-Level Parallelism (ILP)</b> refers to the potential for simultaneously executing multiple instructions from a sequential instruction stream by exploiting independence between instructions."))
    story.append(spacer(4))
    story.append(bold("ILP Exploitation Techniques:"))
    story.append(mk_table(
        ["Technique", "Mechanism", "Hardware Required"],
        [["Pipelining", "Overlap fetch/decode/execute stages", "Pipeline registers"],
         ["Superscalar", "Multiple execution units in parallel", "Multiple ALUs/FPUs"],
         ["Out-of-Order Execution", "Execute independent instructions early", "Reservation stations, ROB"],
         ["Branch Prediction", "Speculatively fetch predicted path", "Branch target buffer"],
         ["Register Renaming", "Eliminate false (WAR/WAW) dependencies", "Physical register file"]],
        [40*mm, 72*mm, 58*mm]
    ))
    story.append(spacer(4))
    story.append(bold("Fundamental Limitations of ILP:"))
    story.append(bullet("<b>True Data Dependency (RAW):</b> Instruction B needs result from A — cannot reorder."))
    story.append(bullet("<b>Anti-dependency (WAR):</b> B writes to register that A reads — partially solved by renaming."))
    story.append(bullet("<b>Output Dependency (WAW):</b> Two writes to same register — solved by renaming."))
    story.append(bullet("<b>Control Dependencies:</b> Branch outcomes unknown until executed."))
    story.append(bullet("<b>Memory Aliases:</b> Unknown if two memory addresses are the same."))
    story.append(callout("DEEP-DIVE", "AMDAHL'S LAW", "Speedup = 1 / (S + P/N) where S=serial fraction, P=parallel fraction, N=processors. Even with infinite processors, speedup is limited by the serial portion."))
    story.append(spacer(10))

    # Q26 Binary Codes
    story.append(h2("Q26. Types of Binary Codes"))
    story.append(takeaway("Binary codes are systematic encodings that map decimal or character data into binary patterns with specific properties."))
    story.append(mk_table(
        ["Code", "Full Name", "Encoding Rule", "Example"],
        [["BCD", "Binary Coded Decimal", "Each decimal digit → 4 binary bits", "25 → 0010 0101"],
         ["Gray", "Gray Code / Reflected Binary", "Adjacent values differ by 1 bit only", "3 → 0010, 4 → 0110"],
         ["ASCII", "American Standard Code for Info Interchange", "7-bit code for 128 characters", "'A' → 100 0001 (65)"],
         ["Excess-3", "XS-3 Code", "BCD + 3 for each digit", "5 → 0101+0011=1000"],
         ["2421 Code", "Weighted BCD variant", "Weights: 2,4,2,1 — self-complementing", "5 → 1011"]],
        [22*mm, 45*mm, 65*mm, 38*mm]
    ))
    story.append(callout("INSIGHT", "INSIGHT", "Gray code is used in rotary encoders and ADCs because mechanical systems can momentarily show ambiguous states during transitions — Gray code ensures only 1 bit is ambiguous at any time."))
    story.append(spacer(10))

    # Q27 Arithmetic Micro-operations
    story.append(h2("Q27. Arithmetic Micro-operations"))
    story.append(takeaway("Arithmetic micro-operations are the numerical building blocks of all computation — they directly map to ALU hardware."))
    story.append(mk_table(
        ["Operation", "RTL Notation", "Description", "Hardware"],
        [["Addition", "R3 ← R1 + R2", "Adds contents of R1 and R2, result in R3", "Adder circuit"],
         ["Subtraction", "R3 ← R1 - R2", "R1 minus R2 (implemented as R1 + 2's comp R2)", "Adder + NOT + 1"],
         ["Increment", "R1 ← R1 + 1", "Adds 1 to register contents", "Adder with Cin=1"],
         ["Decrement", "R1 ← R1 - 1", "Subtracts 1 from register", "Adder, add (-1)"],
         ["1's Complement", "R1 ← R1'", "Inverts all bits of R1", "NOT gate per bit"],
         ["2's Complement", "R1 ← R1' + 1", "Negation; 1's comp + 1", "NOT + Increment"],
         ["Multiply", "R3 ← R1 × R2", "Partial-product accumulation", "Array multiplier"]],
        [35*mm, 40*mm, 65*mm, 30*mm]
    ))
    story.append(spacer(10))

    # Q28 3-to-8 Decoder (5-mark version)
    story.append(h2("Q28. 3-to-8 Line Decoder (Binary to Octal)"))
    story.append(takeaway("A decoder activates exactly ONE of 2^n outputs based on n input lines — the inverse of an encoder."))
    story.append(body("A <b>3-to-8 line decoder</b> has 3 input lines (A2, A1, A0) and 8 output lines (D0–D7). Exactly one output is HIGH at any time, corresponding to the decimal equivalent of the binary input."))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>D0 = A2'.A1'.A0'  (when input = 000)</font>", S['body']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>D1 = A2'.A1'.A0   (when input = 001)</font>", S['body']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>D2 = A2'.A1.A0'   (when input = 010)</font>", S['body']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>D7 = A2.A1.A0     (when input = 111)</font>", S['body']))
    story.append(spacer(4))
    story.append(truth_table(
        ["A2","A1","A0","D0","D1","D2","D3","D4","D5","D6","D7"],
        [["0","0","0","1","0","0","0","0","0","0","0"],
         ["0","0","1","0","1","0","0","0","0","0","0"],
         ["0","1","0","0","0","1","0","0","0","0","0"],
         ["0","1","1","0","0","0","1","0","0","0","0"],
         ["1","0","0","0","0","0","0","1","0","0","0"],
         ["1","0","1","0","0","0","0","0","1","0","0"],
         ["1","1","0","0","0","0","0","0","0","1","0"],
         ["1","1","1","0","0","0","0","0","0","0","1"]]
    ))
    story.append(PageBreak())


# ─── SECTION C ────────────────────────────────────────────────────────────────
def section_c(story):
    story.append(section_header("C", "Long Answer Questions", C_SECTION_C,
                                 "8 Marks Each | Answer ANY 4 of 6"))
    story.append(spacer(8))

    # Q29 SR Flip-Flop
    story.append(h2("Q29. SR Flip-Flop — Full Detailed Answer"))
    story.append(takeaway("The SR flip-flop is the foundational 1-bit memory cell — all other flip-flops derive from it."))
    story.append(body("An <b>SR (Set-Reset) Flip-Flop</b> is a bistable sequential circuit that can store one bit of binary information. It has two inputs — S (Set) and R (Reset) — and two outputs — Q and Q' (complement)."))
    story.append(spacer(4))
    story.append(bold("Construction Method 1 — Using NOR Gates:"))
    story.append(bullet("Two cross-coupled NOR gates where output of each feeds back as input to the other."))
    story.append(bullet("Gate 1: Q  = (R + Q')' — NOR of R and Q'"))
    story.append(bullet("Gate 2: Q' = (S + Q)'  — NOR of S and Q"))
    story.append(spacer(4))
    story.append(bold("Construction Method 2 — Using NAND Gates:"))
    story.append(bullet("Active-LOW version: inputs are S' and R' (inverted)."))
    story.append(bullet("NAND SR: S'=0,R'=1 → Set; S'=1,R'=0 → Reset; S'=R'=1 → Hold."))
    story.append(spacer(4))
    story.append(bold("Truth Table and State Transitions:"))
    story.append(truth_table(
        ["S", "R", "Q (next)", "Q' (next)", "State"],
        [["0","0","Q","Q'","No Change (Hold)"],
         ["0","1","0","1","Reset (Q=0)"],
         ["1","0","1","0","Set (Q=1)"],
         ["1","1","X","X","FORBIDDEN (undefined)"]]
    ))
    story.append(spacer(4))
    story.append(bold("Clocked SR Flip-Flop:"))
    story.append(body("A clock input (CLK) is ANDed with S and R inputs. The flip-flop changes state only on the active clock edge, enabling synchronous circuit design."))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>S_internal = S AND CLK</font>", S['body']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>R_internal = R AND CLK</font>", S['body']))
    story.append(spacer(4))
    story.append(bold("Characteristic Equation:"))
    story.append(Paragraph("<font name='Courier' color='#58A6FF'>Q(next) = S + R'.Q    (condition: S.R = 0)</font>", S['body']))
    story.append(spacer(4))
    story.append(bold("Applications of SR Flip-Flop:"))
    story.append(mk_table(
        ["Application", "How SR FF is Used", "S signal", "R signal"],
        [["Debounce switch", "Latch first state change", "Switch press", "Switch release"],
         ["Memory cell", "Store 1-bit data", "Write 1", "Write 0"],
         ["Alarm circuit", "Hold alarm state", "Trigger event", "Reset button"],
         ["Control register bit", "Flag set/clear", "Set condition", "Clear condition"]],
        [45*mm, 55*mm, 30*mm, 40*mm]
    ))
    story.append(callout("CRITICAL", "FORBIDDEN STATE", "When S=R=1 in NOR-based SR: both Q and Q' simultaneously become 0, violating the complementary output rule. When the inputs return to 0,0, the next state is unpredictable (race condition). This is why JK FF was invented — it eliminates this forbidden state."))
    story.append(spacer(10))

    # Q30 DMA Controller
    story.append(h2("Q30. DMA Controller — Working and Block Diagram"))
    story.append(takeaway("DMA offloads bulk data transfer from the CPU to a dedicated controller, freeing the CPU for computation during I/O."))
    story.append(body("<b>Direct Memory Access (DMA)</b> is a hardware mechanism that allows I/O devices to transfer data directly to/from main memory without requiring the CPU to execute each data transfer instruction individually. The DMA controller acts as a secondary bus master."))
    story.append(spacer(4))
    story.append(bold("DMA Controller Internal Registers:"))
    story.append(mk_table(
        ["Register", "Size", "Content / Purpose"],
        [["Address Register", "16-bit", "Holds starting memory address for the transfer"],
         ["Word Count Register", "16-bit", "Number of words/bytes remaining to transfer"],
         ["Data Register", "16-bit", "Temporary buffer between device and memory"],
         ["Status/Control Reg", "8-bit", "Interrupt enable, read/write mode, transfer complete flag"]],
        [45*mm, 25*mm, 100*mm]
    ))
    story.append(spacer(4))
    story.append(bold("DMA Transfer Process — Step by Step:"))
    story.append(bullet("<b>Step 1 — Initialisation:</b> CPU programs the DMA controller with starting memory address, transfer count, and direction (read/write). CPU then continues executing other tasks."))
    story.append(bullet("<b>Step 2 — Bus Request:</b> When device is ready (e.g., disk sector loaded), DMA asserts BR (Bus Request) signal to the CPU."))
    story.append(bullet("<b>Step 3 — Bus Grant:</b> CPU completes current memory cycle, asserts BG (Bus Grant), and tri-states its bus drivers (releases the bus)."))
    story.append(bullet("<b>Step 4 — Data Transfer:</b> DMA takes control of address and data bus. Places memory address on address bus, reads data from I/O device into data register, writes to memory. Increments address register, decrements word count."))
    story.append(bullet("<b>Step 5 — Repeat:</b> DMA transfers one word per bus cycle. Steps 2–4 repeat until word count reaches zero."))
    story.append(bullet("<b>Step 6 — Interrupt:</b> DMA asserts interrupt line (IEN). CPU receives interrupt, resumes data processing using the transferred data."))
    story.append(spacer(4))
    story.append(bold("DMA Block Diagram Components:"))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>+----------+    BR/BG     +--------+    Address Bus   +--------+</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>|   CPU    |<----------->|  DMA   |----------------->| Memory |</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>+----------+   Interrupt +--------+    Data Bus       +--------+</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>                              ^                               </font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>                              | Data                          </font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>                         +---------+                          </font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>                         | I/O Dev |  (Disk, NIC, etc.)       </font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>                         +---------+                          </font>", S['code']))
    story.append(spacer(4))
    story.append(bold("DMA Transfer Modes:"))
    story.append(mk_table(
        ["Mode", "Mechanism", "CPU Impact", "Use Case"],
        [["Burst Mode", "DMA holds bus for entire block transfer", "CPU blocked for duration", "Large block transfers"],
         ["Cycle Stealing", "DMA steals 1 bus cycle at a time", "Minimal CPU slowdown", "Real-time systems"],
         ["Transparent Mode", "DMA transfers only when CPU doesn't need bus", "Zero CPU impact", "Low-priority background transfers"]],
        [35*mm, 60*mm, 40*mm, 35*mm]
    ))
    story.append(callout("INSIGHT", "WHY DMA MATTERS", "Without DMA, a CPU transferring a 512-byte disk sector at 1 byte/instruction would spend 512 I/O instructions. With DMA, the CPU issues ONE setup command and the DMA handles all 512 transfers autonomously."))
    story.append(spacer(10))

    # Q31 3x8 Line Decoder (8-mark)
    story.append(h2("Q31. 3×8 Line Decoder — Full Answer"))
    story.append(takeaway("A decoder is a demultiplexer of control signals — it activates exactly one output line for every unique input combination."))
    story.append(body("A <b>3-to-8 line decoder</b> converts a 3-bit binary address (A2, A1, A0) into one of 8 active output lines (D0–D7). It has one <b>Enable (E)</b> input — when E=0, all outputs are LOW regardless of inputs."))
    story.append(spacer(4))
    story.append(bold("Boolean Output Equations:"))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>D0 = E.A2'.A1'.A0'    D4 = E.A2.A1'.A0'</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>D1 = E.A2'.A1'.A0     D5 = E.A2.A1'.A0</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>D2 = E.A2'.A1.A0'     D6 = E.A2.A1.A0'</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>D3 = E.A2'.A1.A0      D7 = E.A2.A1.A0</font>", S['code']))
    story.append(spacer(4))
    story.append(bold("Complete Truth Table (Enable E=1):"))
    story.append(truth_table(
        ["A2","A1","A0","D0","D1","D2","D3","D4","D5","D6","D7"],
        [["0","0","0","1","0","0","0","0","0","0","0"],
         ["0","0","1","0","1","0","0","0","0","0","0"],
         ["0","1","0","0","0","1","0","0","0","0","0"],
         ["0","1","1","0","0","0","1","0","0","0","0"],
         ["1","0","0","0","0","0","0","1","0","0","0"],
         ["1","0","1","0","0","0","0","0","1","0","0"],
         ["1","1","0","0","0","0","0","0","0","1","0"],
         ["1","1","1","0","0","0","0","0","0","0","1"]]
    ))
    story.append(spacer(4))
    story.append(bold("Gate-Level Implementation:"))
    story.append(bullet("3 NOT gates (to generate A2', A1', A0')"))
    story.append(bullet("8 three-input AND gates (one per output, includes E input)"))
    story.append(bullet("Total: 11 gates"))
    story.append(spacer(4))
    story.append(bold("Expanding Decoders:"))
    story.append(mk_table(
        ["From", "To", "Method", "Gates Needed"],
        [["2-to-4", "3-to-8", "Two 2-to-4 decoders + enable logic", "2 decoders + 1 NOT"],
         ["3-to-8", "4-to-16", "Two 3-to-8 decoders + 1 NOT gate", "2 decoders + 1 NOT"],
         ["3-to-8", "5-to-32", "Four 3-to-8 + one 2-to-4", "Complex tree"]],
        [30*mm, 30*mm, 80*mm, 30*mm]
    ))
    story.append(bold("Applications:"))
    story.append(bullet("<b>Memory address decoding:</b> Select one of 8 memory chips based on upper address bits."))
    story.append(bullet("<b>Instruction decoding:</b> Activate one of 8 micro-operation sequences."))
    story.append(bullet("<b>Demultiplexer:</b> Route data to one of 8 destinations."))
    story.append(spacer(10))

    # Q32 Instruction Cycle
    story.append(h2("Q32. Instruction Cycle — All Phases and Micro-operations"))
    story.append(takeaway("The instruction cycle is the fundamental heartbeat of every CPU — it repeats billions of times per second."))
    story.append(body("The <b>Instruction Cycle</b> (also called the Fetch-Decode-Execute cycle) is the complete process the CPU performs for every single machine instruction. It consists of multiple sub-cycles, each composed of register transfer micro-operations."))
    story.append(spacer(4))
    story.append(bold("Phase 1 — FETCH (Get instruction from memory):"))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>T0: AR ← PC                 (load address register from PC)</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>T1: IR ← M[AR], PC ← PC+1  (read memory into IR, advance PC)</font>", S['code']))
    story.append(spacer(4))
    story.append(bold("Phase 2 — DECODE (Determine instruction type):"))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>T2: AR ← IR(0-11), D ← Decode(IR(12-14))</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#8B949E'>    IR[12-14] = opcode bits, IR[0-11] = address field</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#8B949E'>    D0–D7 decoder outputs determine instruction type</font>", S['code']))
    story.append(spacer(4))
    story.append(bold("Phase 3 — INDIRECT ADDRESS (if I-bit = 1):"))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>T3: if I=1: AR ← M[AR]      (fetch effective address)</font>", S['code']))
    story.append(spacer(4))
    story.append(bold("Phase 4 — EXECUTE (Perform the operation):"))
    story.append(body("The execution sub-cycle depends on the decoded instruction type:"))
    story.append(mk_table(
        ["Instruction Type", "Micro-operations", "Description"],
        [["AND (D0)", "T4: DR←M[AR]; T5: AC←AC∧DR", "AND memory with AC"],
         ["ADD (D1)", "T4: DR←M[AR]; T5: AC←AC+DR, E←Cout", "Add memory to AC"],
         ["LDA (D2)", "T4: DR←M[AR]; T5: AC←DR", "Load memory into AC"],
         ["STA (D3)", "T4: M[AR]←AC", "Store AC into memory"],
         ["BUN (D4)", "T4: PC←AR", "Unconditional branch"],
         ["BSA (D5)", "T4: M[AR]←PC, AR←AR+1; T5: PC←AR", "Branch and save address"],
         ["ISZ (D6)", "T4: DR←M[AR]; T5: DR←DR+1; T6: M[AR]←DR, if DR=0: PC←PC+1", "Increment and skip"]],
        [35*mm, 75*mm, 60*mm]
    ))
    story.append(spacer(4))
    story.append(bold("Instruction Cycle Flowchart (text representation):"))
    story.append(Paragraph("<font name='Courier' color='#58A6FF'>START → [FETCH: AR←PC, IR←M[AR], PC←PC+1]</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#58A6FF'>      → [DECODE: AR←IR(addr), D←decode(IR(op))]</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#58A6FF'>      → {I=1?} YES→[AR←M[AR]] NO→skip</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#58A6FF'>      → {D0-D6?} → [EXECUTE appropriate micro-ops]</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#58A6FF'>      → {D7, I/O?} → [Input/Output micro-ops]</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#58A6FF'>      → LOOP back to FETCH</font>", S['code']))
    story.append(callout("DEEP-DIVE", "TIMING", "Each micro-operation takes exactly one clock cycle (T period). A full instruction may take T0 through T5 (6 clock cycles) or T0–T3 for simple instructions. The control unit uses a timing ring counter to generate T0,T1,...Tn signals."))
    story.append(spacer(10))

    # Q33 Addressing Modes
    story.append(h2("Q33. Addressing Modes — Five Modes with Examples"))
    story.append(takeaway("Addressing modes define how the CPU computes the Effective Address (EA) of the operand — they are the flexibility mechanism of ISA design."))
    story.append(mk_table(
        ["Mode", "Effective Address", "Example", "Advantage"],
        [["Immediate", "Operand IS the data", "ADD #5 (adds 5 directly)", "No memory access needed"],
         ["Direct (Absolute)", "EA = Address field", "ADD 500 (adds M[500])", "Simple, 1 memory access"],
         ["Indirect", "EA = M[Address field]", "ADD @500 (EA = M[500])", "Pointer-style access"],
         ["Register Direct", "EA = Register", "ADD R1 (adds value in R1)", "Fastest — no memory"],
         ["Register Indirect", "EA = M[Register]", "ADD (R1) (EA = M[R1])", "Array/pointer traversal"],
         ["Displacement/Based", "EA = Base_Reg + Offset", "ADD 10(R1)", "Array indexing, stack frames"],
         ["Relative", "EA = PC + Offset", "JUMP +5 (jump 5 ahead)", "Position-independent code"]],
        [40*mm, 45*mm, 45*mm, 40*mm]
    ))
    story.append(spacer(4))
    story.append(bold("Numerical Example (Indirect Addressing):"))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>Instruction: LOAD INDIRECT 500</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>M[500] = 800  (500 holds pointer to actual data)</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>M[800] = 42   (actual data)</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>Result: AC ← 42  (two memory accesses total)</font>", S['code']))
    story.append(callout("CRITICAL", "EXAM TRAP", "Immediate mode: the operand IS the constant value. Direct mode: the address field IS the memory address. Indirect mode: the address field points to the location that CONTAINS the actual address. Students confuse direct and indirect."))
    story.append(spacer(10))

    # Q34 Multithreaded Architecture
    story.append(h2("Q34. Multithreaded Architecture"))
    story.append(takeaway("Multithreading hides memory latency by switching to another thread while one thread waits for data — it keeps the CPU pipeline full."))
    story.append(body("<b>Multithreading</b> is a hardware technique that allows a single CPU core to maintain multiple thread contexts simultaneously, switching between them to hide latency (especially memory access latency of 100–300 cycles)."))
    story.append(spacer(4))
    story.append(bold("Hardware Required:"))
    story.append(bullet("Multiple Program Counters (one per thread context)"))
    story.append(bullet("Multiple Register Files (or partitioned register file)"))
    story.append(bullet("Multiple Stack Pointers and status registers"))
    story.append(bullet("Thread scheduler in the control unit"))
    story.append(spacer(4))
    story.append(mk_table(
        ["Type", "Switch Mechanism", "Granularity", "Latency Hidden", "Example"],
        [["Fine-Grained (FMT)", "Switch every clock cycle, round-robin", "1 instruction", "Short latencies (cache miss ~5 cycles)", "Sun UltraSPARC T1"],
         ["Coarse-Grained (CMT)", "Switch only on long-latency stall (cache miss)", "Multiple instructions", "Long latencies (DRAM ~200 cycles)", "IBM AS/400"],
         ["Simultaneous (SMT)", "Multiple threads execute SAME cycle on different execution units", "1 cycle, parallel", "All types", "Intel Hyper-Threading"]],
        [32*mm, 52*mm, 35*mm, 40*mm, 40*mm]
    ))
    story.append(spacer(4))
    story.append(bold("Fine-Grained vs Coarse-Grained — Key Differences:"))
    story.append(mk_table(
        ["Aspect", "Fine-Grained", "Coarse-Grained"],
        [["Switch trigger", "Every clock cycle", "Only on cache miss/stall"],
         ["Overhead", "Zero (always switching)", "Low (rare switches)"],
         ["Single-thread performance", "Poor (diluted per thread)", "Good (runs until stall)"],
         ["Throughput", "High for many threads", "Moderate"],
         ["Pipeline stages needed", "N threads × pipeline depth", "Smaller buffer requirement"]],
        [50*mm, 65*mm, 55*mm]
    ))
    story.append(callout("INSIGHT", "SMT vs MULTICORE", "SMT (Hyper-Threading) makes 1 physical core appear as 2 logical cores. A true dual-core has 2 complete physical execution units. SMT improves throughput by ~25-30%; dual-core doubles throughput for parallel workloads."))
    story.append(spacer(10))

    # Q35 Shift Registers
    story.append(h2("Q35. Shift Registers with Parallel Load"))
    story.append(takeaway("A shift register with parallel load is the hardware foundation of serial-to-parallel data conversion used in UART, SPI, and I2C interfaces."))
    story.append(body("A <b>shift register</b> is a cascade of D flip-flops where the output of each feeds the input of the next. It shifts data left or right by one bit position per clock cycle."))
    story.append(spacer(4))
    story.append(mk_table(
        ["Type", "Full Name", "Data In", "Data Out", "Application"],
        [["SISO", "Serial In, Serial Out", "1 bit/cycle", "1 bit/cycle", "Data delay lines, LFSR"],
         ["SIPO", "Serial In, Parallel Out", "1 bit/cycle", "n bits at once", "Serial-to-parallel conversion (UART RX)"],
         ["PISO", "Parallel In, Serial Out", "n bits at once", "1 bit/cycle", "Parallel-to-serial conversion (UART TX)"],
         ["PIPO", "Parallel In, Parallel Out", "n bits at once", "n bits at once", "CPU registers, buffer registers"]],
        [18*mm, 48*mm, 32*mm, 32*mm, 40*mm]
    ))
    story.append(spacer(4))
    story.append(bold("4-bit PISO Shift Register with Parallel Load — Operation:"))
    story.append(bullet("<b>Load Mode (Load/Shift = 1):</b> All flip-flops simultaneously load their parallel input D0–D3. The 4-bit word is captured in one clock cycle."))
    story.append(bullet("<b>Shift Mode (Load/Shift = 0):</b> Each clock cycle, FF0 → FF1 → FF2 → FF3, MSB shifts out serially."))
    story.append(bullet("<b>Control Logic per FF:</b> Output = (Load · Di) + (Shift · Q_prev)"))
    story.append(spacer(4))
    story.append(bold("Cascaded Shift Register Micro-operations:"))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>shl  R  →  Ri ← R(i-1), R0 ← 0    (shift left,  0 fills LSB)</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>shr  R  →  Ri ← R(i+1), Rn ← 0   (shift right, 0 fills MSB)</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>cil  R  →  Ri ← R(i-1), R0 ← Rn  (circular left,  wrap MSB)</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>cir  R  →  Ri ← R(i+1), Rn ← R0  (circular right, wrap LSB)</font>", S['code']))
    story.append(callout("INSIGHT", "INSIGHT", "Left-shifting by 1 bit is equivalent to multiplying by 2. Right-shifting by 1 bit is equivalent to dividing by 2 (integer division). This is how early CPUs implemented fast multiplication."))
    story.append(spacer(10))

    # Q36 Register-reference instructions
    story.append(h2("Q36. Register-Reference Instructions"))
    story.append(takeaway("Register-reference instructions operate directly on the AC register — they need NO memory access and execute in a single clock cycle."))
    story.append(body("Register-reference instructions are identified by opcode <b>D7=1, I=0</b> in the basic computer. They use bits 0–11 of the instruction register to specify the operation (one bit per operation)."))
    story.append(spacer(4))
    story.append(mk_table(
        ["Mnemonic", "Bit", "RTL Operation", "Description"],
        [["CLA", "B11", "AC ← 0", "Clear the Accumulator"],
         ["CLE", "B10", "E ← 0", "Clear the E (carry) flag"],
         ["CMA", "B9", "AC ← AC'", "Complement the Accumulator (1's complement)"],
         ["CME", "B8", "E ← E'", "Complement the E bit"],
         ["CIR", "B7", "AC ← shr AC, AC[15]←E, E←AC[0]", "Circular shift right (AC and E)"],
         ["CIL", "B6", "AC ← shl AC, AC[0]←E, E←AC[15]", "Circular shift left (AC and E)"],
         ["INC", "B5", "AC ← AC + 1", "Increment the Accumulator"],
         ["SPA", "B4", "if AC[15]=0: PC←PC+1", "Skip if AC positive (MSB=0)"],
         ["SNA", "B3", "if AC[15]=1: PC←PC+1", "Skip if AC negative (MSB=1)"],
         ["SZA", "B2", "if AC=0: PC←PC+1", "Skip if AC is Zero"],
         ["SZE", "B1", "if E=0: PC←PC+1", "Skip if E is Zero"],
         ["HLT", "B0", "S ← 0", "Halt the computer (stop clock)"]],
        [20*mm, 15*mm, 70*mm, 65*mm]
    ))
    story.append(callout("DEEP-DIVE", "DEEP-DIVE", "The skip instructions (SPA, SNA, SZA, SZE) implement conditional branching without a dedicated branch opcode. They skip the NEXT instruction (usually a BUN). Combined: SPA → BUN label → means 'if positive, jump to label'."))
    story.append(spacer(10))

    # Q37 Cross-bar switch
    story.append(h2("Q37. Cross-bar Switch and Multi-stage Switching Network"))
    story.append(takeaway("Crossbar switches provide full non-blocking connectivity; multi-stage networks reduce hardware cost at the price of potential blocking."))
    story.append(body("In multiprocessor systems, processors must communicate with memory modules. The <b>interconnection network</b> determines the bandwidth and latency of this communication."))
    story.append(spacer(4))
    story.append(bold("Crossbar Switch:"))
    story.append(body("An N×M crossbar switch connects N processors to M memory modules using N×M switching elements (intersection points). Any processor can be connected to any memory module simultaneously as long as no two processors access the same module."))
    story.append(bullet("<b>Non-blocking:</b> N processors can access N different memories simultaneously."))
    story.append(bullet("<b>Hardware cost:</b> O(N²) switching elements — expensive for large N."))
    story.append(bullet("<b>Complexity:</b> O(N²) — feasible up to ~16 processors."))
    story.append(spacer(4))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>4×4 Crossbar (P=Processors, M=Memory):</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>     M0   M1   M2   M3</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>P0 [ X ] [   ] [   ] [   ]</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>P1 [   ] [ X ] [   ] [   ]</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>P2 [   ] [   ] [ X ] [   ]</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>P3 [   ] [   ] [   ] [ X ]</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#8B949E'>X = active connection</font>", S['code']))
    story.append(spacer(4))
    story.append(bold("Multi-stage Interconnection Network (MIN):"))
    story.append(body("A MIN uses multiple stages of smaller switching elements (typically 2×2) to connect N inputs to N outputs with fewer total switches than a crossbar."))
    story.append(mk_table(
        ["Network", "Stages", "Switches", "Blocking?", "Examples"],
        [["Crossbar", "1", "N²", "No (non-blocking)", "Small shared-memory MPs"],
         ["Omega Network", "log₂N", "N/2 × log₂N", "Yes (blocking)", "BBN Butterfly"],
         ["Banyan Network", "log₂N", "N/2 × log₂N", "Yes (blocking)", "Research systems"],
         ["Benes Network", "2log₂N - 1", "N(2log₂N-1)/2", "No (rearrangeable)", "Telephone switching"]],
        [40*mm, 25*mm, 40*mm, 30*mm, 35*mm]
    ))
    story.append(callout("CRITICAL", "BLOCKING", "A network is 'blocking' if there exists a valid routing request that CANNOT be satisfied because intermediate switch stages are already occupied. Omega network is blocking — two different source-destination pairs may require the same intermediate switch."))
    story.append(spacer(10))

    # Q38 CPU Organization
    story.append(h2("Q38. Types of CPU Organization"))
    story.append(takeaway("CPU organisation defines how registers, ALU, and memory communicate — the bus structure determines instruction throughput."))
    story.append(mk_table(
        ["Organization", "Bus Structure", "Operations", "Instruction Speed", "Hardware Cost"],
        [["Single Accumulator", "1 data path through AC", "AC-based only", "Slow (many instructions)", "Minimal"],
         ["General Register", "Multiple registers, shared bus", "Flexible register ops", "Medium", "Moderate"],
         ["Single Bus", "1 common bus for all", "1 transfer/cycle", "Slow (bus bottleneck)", "Low"],
         ["Two Bus", "2 parallel buses", "2 transfers/cycle", "Faster", "Medium"],
         ["Three Bus", "3 buses: A, B, Result", "ALU: Rd ← Rs1 op Rs2", "Fastest (1 cycle)", "High"]],
        [40*mm, 42*mm, 35*mm, 30*mm, 23*mm]
    ))
    story.append(spacer(4))
    story.append(bold("Three-Bus Architecture — Single Instruction Example:"))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>ADD R3, R1, R2:</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>  Bus A carries R1 value to ALU input A</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>  Bus B carries R2 value to ALU input B</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>  ALU computes R1+R2 in one cycle</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>  Result bus carries sum to R3</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#8B949E'>  Single-bus equivalent requires 3 separate micro-operations (3 cycles)</font>", S['code']))
    story.append(spacer(10))

    # Q39 Full Adder (detailed)
    story.append(h2("Q39. Full Adder — Detailed Design"))
    story.append(takeaway("Full adder is the core building block of all arithmetic operations in digital computers."))
    story.append(body("A <b>Full Adder</b> accepts three 1-bit inputs (A, B, Cin) and produces a 2-bit output: Sum (S) and Carry-out (Cout). Unlike a half adder, it handles the carry-in from a previous stage, enabling cascaded multi-bit addition."))
    story.append(spacer(4))
    story.append(bold("Boolean Expressions:"))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>S    = A ⊕ B ⊕ Cin</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>Cout = (A·B) + (B·Cin) + (A·Cin)   [majority function]</font>", S['code']))
    story.append(spacer(4))
    story.append(bold("Full Truth Table:"))
    story.append(truth_table(
        ["A","B","Cin","Sum (S)","Cout"],
        [["0","0","0","0","0"],["0","0","1","1","0"],["0","1","0","1","0"],
         ["0","1","1","0","1"],["1","0","0","1","0"],["1","0","1","0","1"],
         ["1","1","0","0","1"],["1","1","1","1","1"]]
    ))
    story.append(spacer(4))
    story.append(bold("Implementation using two Half Adders:"))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>HA1: S1 = A ⊕ B,   C1 = A·B</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>HA2: S  = S1 ⊕ Cin, C2 = S1·Cin</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#3FB950'>Cout= C1 + C2</font>", S['code']))
    story.append(Paragraph("<font name='Courier' color='#8B949E'>Total gates: 2 XOR + 2 AND + 1 OR = 5 gates</font>", S['code']))
    story.append(spacer(10))

    # Q40 De Morgan's Theorem proof
    story.append(h2("Q40. De Morgan's Theorem — State and Prove"))
    story.append(takeaway("De Morgan's theorem is the bridge between NOR/NAND gates and AND/OR logic — it enables universal gate implementations."))
    story.append(bold("FIRST LAW: (A + B)' = A' · B'"))
    story.append(body("The complement of a logical OR equals the logical AND of the complements."))
    story.append(bold("Proof by Perfect Induction (Truth Table):"))
    story.append(truth_table(
        ["A","B","A+B","(A+B)'","A'","B'","A'·B'","Equal?"],
        [["0","0","0","1","1","1","1","YES"],
         ["0","1","1","0","1","0","0","YES"],
         ["1","0","1","0","0","1","0","YES"],
         ["1","1","1","0","0","0","0","YES"]]
    ))
    story.append(spacer(6))
    story.append(bold("SECOND LAW: (A · B)' = A' + B'"))
    story.append(body("The complement of a logical AND equals the logical OR of the complements."))
    story.append(truth_table(
        ["A","B","A·B","(A·B)'","A'","B'","A'+B'","Equal?"],
        [["0","0","0","1","1","1","1","YES"],
         ["0","1","0","1","1","0","1","YES"],
         ["1","0","0","1","0","1","1","YES"],
         ["1","1","1","0","0","0","0","YES"]]
    ))
    story.append(spacer(4))
    story.append(bold("Gate Equivalences (Direct Application):"))
    story.append(mk_table(
        ["Gate", "De Morgan Equivalent", "Diagram Representation"],
        [["NOR(A,B)", "AND(A', B')", "OR → bubble on output = AND with bubbles on inputs"],
         ["NAND(A,B)", "OR(A', B')", "AND → bubble on output = OR with bubbles on inputs"],
         ["NOT(A+B)", "A'·B'", "NOR = AND-with-inverted-inputs"],
         ["NOT(A·B)", "A'+B'", "NAND = OR-with-inverted-inputs"]],
        [35*mm, 35*mm, 100*mm]
    ))
    story.append(spacer(10))

    # Q41 CISC vs RISC (8-mark)
    story.append(h2("Q41. CISC vs RISC — Extended 8-Mark Answer"))
    story.append(takeaway("The CISC-RISC debate shaped modern processor design — today's x86 CPUs decode CISC instructions into RISC-like micro-ops internally."))
    story.append(bold("Historical Context:"))
    story.append(body("CISC emerged in the 1970s when memory was expensive — complex instructions reduced program size. RISC emerged in the 1980s (Patterson/Hennessy at Berkeley/Stanford) based on the observation that 80% of execution time is spent on 20% of instructions — simplifying those yielded massive gains."))
    story.append(spacer(4))
    story.append(mk_table(
        ["Design Dimension", "CISC Architecture", "RISC Architecture"],
        [["Instruction philosophy", "One instruction does more work", "One instruction does one operation"],
         ["Code density", "High (fewer instructions/program)", "Low (more instructions/program)"],
         ["Instruction format", "Variable length (1–15 bytes)", "Fixed length (4 bytes)"],
         ["Execution model", "Microcode-based multi-cycle", "Hardwired single-cycle"],
         ["Register count", "Few (8 in original x86)", "Many (32 in MIPS/ARM)"],
         ["Memory operands", "Allowed in arithmetic ops", "LOAD/STORE only"],
         ["Pipeline efficiency", "Low — unequal instruction times", "High — equal instruction times"],
         ["Compiler complexity", "Low — rich instruction set", "High — compiler must schedule"],
         ["Cache benefit", "Higher miss penalty (complex decode)", "Cache-friendly fixed fetch"],
         ["Power profile", "High power (mobile-unfriendly)", "Low power (mobile-dominant)"],
         ["Modern examples", "Intel Core, AMD Ryzen (x86-64)", "ARM Cortex, Apple M-series, RISC-V"]],
        [50*mm, 67*mm, 53*mm]
    ))
    story.append(spacer(4))
    story.append(callout("DEEP-DIVE", "MODERN REALITY", "Modern x86 CPUs (Intel Sandy Bridge+) internally decode CISC instructions into fixed-width RISC micro-ops before execution. The front-end is CISC-compatible; the back-end is a RISC engine. This gives code compatibility while achieving RISC execution efficiency."))
    story.append(spacer(10))

    # Q42 I/O Interface Unit
    story.append(h2("Q42. I/O Interface Unit"))
    story.append(takeaway("The I/O interface unit bridges the semantic and electrical gap between the CPU's fast parallel bus and slow, diverse peripheral devices."))
    story.append(body("An <b>I/O Interface Unit</b> (also called I/O Controller or Device Controller) is the hardware module that manages communication between the CPU/memory system and an external I/O device. It handles electrical signal conversion, data format conversion, timing synchronisation, and status monitoring."))
    story.append(spacer(4))
    story.append(bold("Internal Structure of an I/O Interface:"))
    story.append(mk_table(
        ["Component", "Function", "Size"],
        [["Data Register", "Buffers data being transferred (CPU↔Device)", "8–32 bits"],
         ["Status Register", "Holds device state: BUSY, READY, ERROR, DONE", "8 bits"],
         ["Control Register", "Accepts commands from CPU (START, STOP, MODE)", "8 bits"],
         ["Address Decoder", "Decodes I/O port address to select this device", "Combinational logic"],
         ["Data Buffer", "Matches device speed to bus speed (FIFO)", "Variable"],
         ["Interrupt Logic", "Asserts IRQ when transfer complete", "1 flip-flop + logic"],
         ["Bus Interface", "Tri-state drivers for data/address bus", "Bus width"]],
        [45*mm, 80*mm, 45*mm]
    ))
    story.append(spacer(4))
    story.append(bold("I/O Transfer Methods Comparison:"))
    story.append(mk_table(
        ["Method", "CPU Involvement", "Mechanism", "Performance"],
        [["Programmed I/O", "100% (busy-wait)", "CPU polls status register in loop", "Poor — CPU wasted"],
         ["Interrupt-driven I/O", "Only on interrupt", "Device interrupts CPU when ready", "Good — CPU free between transfers"],
         ["DMA", "Only setup+completion", "DMA controller manages transfer", "Best — CPU fully free during transfer"]],
        [40*mm, 35*mm, 65*mm, 30*mm]
    ))
    story.append(callout("INSIGHT", "INSIGHT", "Modern systems use a layered approach: small/frequent data via interrupts; bulk transfers via DMA. A USB keyboard uses interrupts; a USB hard drive uses DMA. The OS device driver selects the appropriate method."))
    story.append(spacer(10))

    # Q43 Multiprocessor vs Multicomputer
    story.append(h2("Q43. Multiprocessor vs Multicomputer — Detailed Comparison"))
    story.append(takeaway("Multiprocessors share memory (tight coupling); multicomputers share nothing (loose coupling) — the difference determines programming model and scalability."))
    story.append(mk_table(
        ["Dimension", "Multiprocessor", "Multicomputer"],
        [["Memory", "Shared — all CPUs see same address space", "Private — each node has own memory"],
         ["Communication", "Read/write shared variables", "Message Passing (MPI, send/receive)"],
         ["Coupling", "Tightly coupled", "Loosely coupled"],
         ["Interconnect", "Shared bus or crossbar switch", "Network (Ethernet, InfiniBand)"],
         ["OS", "Single OS instance manages all", "Each node runs own OS"],
         ["Scalability", "Limited (~64 processors) — bus contention", "Highly scalable (thousands of nodes)"],
         ["Latency", "Low — shared memory ~100 ns", "High — network ~1–100 μs"],
         ["Synchronisation", "Hardware primitives (test-and-set)", "Explicit in messages"],
         ["Cost", "Expensive (specialised hardware)", "Cheap commodity hardware"],
         ["Fault tolerance", "Single point of failure (shared bus)", "High — node failure isolated"],
         ["Examples", "Intel SMP, Sun Fire servers", "Beowulf cluster, Google data centre, HPC grids"]],
        [45*mm, 75*mm, 50*mm]
    ))
    story.append(spacer(4))
    story.append(bold("Cache Coherence Problem (Multiprocessors only):"))
    story.append(body("When multiple processors have private caches containing copies of the same memory location, a write by one processor makes other caches stale. Solutions include:"))
    story.append(bullet("<b>Write-Invalidate (MESI protocol):</b> Writing processor marks all other copies invalid. Used by Intel x86."))
    story.append(bullet("<b>Write-Update (Dragon protocol):</b> Writing processor updates all copies simultaneously. Higher bus traffic but faster subsequent reads."))
    story.append(callout("CRITICAL", "NUMA vs UMA", "Uniform Memory Access (UMA): All processors have equal latency to all memory — simple but doesn't scale. Non-Uniform Memory Access (NUMA): Processors access local memory faster than remote — scales to 1000+ processors but programming is harder."))


def quick_ref(story):
    story.append(PageBreak())
    story.append(h1("QUICK REFERENCE — FORMULAS AND KEY FACTS"))
    story.append(hr())
    story.append(spacer(6))
    story.append(mk_table(
        ["Topic", "Key Formula / Fact", "Notes"],
        [["Hit Ratio", "h = Hits / (Hits + Misses)", "Range: 0 to 1; good cache: >0.95"],
         ["Avg Access Time", "T = h·Tc + (1-h)·Tm", "Tc = cache time, Tm = main memory time"],
         ["Full Adder Sum", "S = A ⊕ B ⊕ Cin", "XOR of all three inputs"],
         ["Full Adder Carry", "Cout = AB + BCin + ACin", "Majority function"],
         ["De Morgan 1", "(A+B)' = A'·B'", "NOR = AND with inverted inputs"],
         ["De Morgan 2", "(A·B)' = A'+B'", "NAND = OR with inverted inputs"],
         ["4:1 MUX output", "Y = S1'S0'I0 + S1'S0I1 + S1S0'I2 + S1S0I3", "2 select lines"],
         ["Gray Code MSB", "G[n] = B[n]", "MSB copied directly"],
         ["Gray Code rest", "G[i] = B[i] ⊕ B[i+1]", "XOR with next higher bit"],
         ["BUN operation", "PC ← AR", "Unconditional branch"],
         ["BSA operation", "M[AR] ← PC, PC ← AR+1", "Save return address, jump"],
         ["Decoder outputs", "D[i] = AND of address bits/complements", "Exactly 1 active at a time"],
         ["SR FF char. eq.", "Q(next) = S + R'·Q", "Condition: S·R = 0"],
         ["Cache levels", "L1 < L2 < L3 < RAM", "Speed: L1 fastest; Size: RAM largest"],
         ["RISC vs CISC", "RISC: fixed width, 1-cycle; CISC: variable, multi-cycle", ""],
         ["DMA modes", "Burst / Cycle Stealing / Transparent", "Cycle stealing most common"]],
        [45*mm, 85*mm, 40*mm]
    ))
    story.append(spacer(10))

    story.append(h2("EXAM STRATEGY — SECTION-WISE"))
    story.append(mk_table(
        ["Section", "Strategy", "Time Budget", "Marks"],
        [["Section A (2M)", "Answer all 4 — definitions + 1 sentence explanation. No elaboration needed.", "10 min", "8"],
         ["Section B (5M)", "Choose 4 easiest. Tables/truth tables get full marks fast. K-Map always attempt.", "35 min", "20"],
         ["Section C (8M)", "Prioritise: SR FF, DMA, Instruction Cycle, Decoder. Draw neat diagrams. Write equations.", "75 min", "32"]],
        [30*mm, 100*mm, 25*mm, 15*mm]
    ))
    story.append(spacer(10))
    story.append(h2("HIGH-PROBABILITY QUESTIONS FOR 2025-26"))
    story.append(mk_table(
        ["Rank", "Topic", "Section", "Appeared In"],
        [["#1", "SR Flip-Flop", "C", "Both 2024 and 2025 papers"],
         ["#2", "DMA Controller", "C", "Both 2024 and 2025 papers"],
         ["#3", "Instruction Cycle + Flowchart", "C", "Both papers + question bank"],
         ["#4", "3×8 Line Decoder", "C/B", "Both papers + question bank"],
         ["#5", "K-Map Simplification", "B", "Every paper"],
         ["#6", "Addressing Modes", "C", "Question bank priority"],
         ["#7", "CISC vs RISC", "B/C", "Both papers"],
         ["#8", "Full Adder", "B/C", "Both papers"],
         ["#9", "Multithreaded Architecture", "C", "Both papers"],
         ["#10", "Register-reference instructions", "C", "2025 paper + question bank"]],
        [15*mm, 75*mm, 25*mm, 55*mm]
    ))


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN BUILD
# ═══════════════════════════════════════════════════════════════════════════════
def build_pdf():
    path = Path(__file__).resolve().parent / "DCCA201_Computer_Architecture_Master_Notes.pdf"
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        rightMargin=18*mm, leftMargin=18*mm,
        topMargin=18*mm, bottomMargin=18*mm,
        title="DCCA201 Computer Architecture — Master Study Notes",
        author="Exam Prep System"
    )

    def on_page(canvas, doc):
        canvas.saveState()
        # Dark background
        canvas.setFillColor(C_BG_DARK)
        canvas.rect(0, 0, W, H, fill=1, stroke=0)
        # Top bar
        canvas.setFillColor(C_CARD_BG)
        canvas.rect(0, H-10*mm, W, 10*mm, fill=1, stroke=0)
        canvas.setFillColor(C_ACCENT)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.drawString(18*mm, H-7*mm, "DCCA201 — Computer Architecture Master Notes")
        canvas.setFillColor(C_MUTED)
        canvas.drawRightString(W-18*mm, H-7*mm, f"Page {doc.page}")
        # Bottom bar
        canvas.setFillColor(C_CARD_BG)
        canvas.rect(0, 0, W, 8*mm, fill=1, stroke=0)
        canvas.setFillColor(C_MUTED)
        canvas.setFont("Helvetica", 7)
        canvas.drawCentredString(W/2, 3*mm,
            "BCA II Semester — NEP Scheme | All Sections A, B & C Covered")
        canvas.restoreState()

    story = []
    cover_page(story)
    toc_page(story)
    section_a(story)
    section_b(story)
    section_c(story)
    quick_ref(story)

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF built: {path}")
    return str(path)

if __name__ == "__main__":
    build_pdf()
