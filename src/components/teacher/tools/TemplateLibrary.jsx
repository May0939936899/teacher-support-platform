'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const CATEGORIES = [
  { key: 'all', label: 'ทั้งหมด', icon: '📁' },
  { key: 'letter', label: 'จดหมาย', icon: '✉️' },
  { key: 'lesson', label: 'แผนการสอน', icon: '📚' },
  { key: 'rubric', label: 'Rubric', icon: '📊' },
  { key: 'announcement', label: 'ประกาศ', icon: '📢' },
  { key: 'report', label: 'รายงาน', icon: '📝' },
];

const TEMPLATES = [
  {
    id: '1', category: 'letter', name: 'จดหมายเชิญวิทยากร',
    desc: 'จดหมายเชิญวิทยากรภายนอกมาบรรยายพิเศษ',
    content: 'ที่ ศธ ___/___\n\nวันที่ ________\n\nเรื่อง  ขอเชิญเป็นวิทยากรบรรยายพิเศษ\nเรียน  _______________\n\nด้วยคณะ____________ มหาวิทยาลัยศรีปทุม ได้จัดโครงการ____________\nในรายวิชา____________ ภาคเรียนที่ ___/___\n\nในการนี้ จึงใคร่ขอเรียนเชิญท่านให้เกียรติเป็นวิทยากรบรรยายพิเศษ\nในหัวข้อ "____________"\nวันที่ ____________ เวลา ____________\nณ ____________\n\nจึงเรียนมาเพื่อโปรดพิจารณา และหวังเป็นอย่างยิ่งว่าจะได้รับเกียรติจากท่าน\n\nขอแสดงความนับถือ\n\n(____________)\nอาจารย์ผู้สอน\nคณะ____________',
  },
  {
    id: '2', category: 'letter', name: 'จดหมายขอความอนุเคราะห์สถานที่',
    desc: 'ขอใช้สถานที่จัดกิจกรรมการเรียนการสอน',
    content: 'ที่ ศธ ___/___\n\nวันที่ ________\n\nเรื่อง  ขอความอนุเคราะห์ใช้สถานที่\nเรียน  _______________\n\nด้วยคณะ____________ มหาวิทยาลัยศรีปทุม มีความประสงค์ขอใช้สถานที่ของท่าน\nเพื่อจัดกิจกรรม____________ ให้แก่นักศึกษา จำนวน ___ คน\n\nวันที่ ____________ เวลา ____________\nสถานที่ที่ขอใช้: ____________\n\nรายละเอียดกิจกรรม:\n- ____________\n- ____________\n\nจึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ด้วย จักขอบคุณยิ่ง\n\nขอแสดงความนับถือ\n\n(____________)',
  },
  {
    id: '3', category: 'letter', name: 'จดหมายส่งตัวนักศึกษาฝึกงาน',
    desc: 'หนังสือส่งตัวนักศึกษาฝึกงาน/สหกิจศึกษา',
    content: 'ที่ ศธ ___/___\n\nวันที่ ________\n\nเรื่อง  ขอส่งตัวนักศึกษาเข้าฝึกงาน/สหกิจศึกษา\nเรียน  ผู้จัดการ/ผู้อำนวยการ _______________\n\nตามที่ท่านได้ให้ความอนุเคราะห์รับนักศึกษาของมหาวิทยาลัยศรีปทุม\nเข้าฝึกงาน/สหกิจศึกษา ณ สถานประกอบการของท่านนั้น\n\nบัดนี้ คณะ____________ ขอส่งตัวนักศึกษาดังมีรายชื่อต่อไปนี้:\n\n1. ____________ รหัส ____________\n2. ____________ รหัส ____________\n\nระยะเวลาฝึกงาน: ____________ ถึง ____________\n\nจึงเรียนมาเพื่อโปรดทราบ และขอขอบคุณในความอนุเคราะห์\n\nขอแสดงความนับถือ\n\n(____________)\nอาจารย์ที่ปรึกษา',
  },
  {
    id: '4', category: 'letter', name: 'จดหมายแจ้งผู้ปกครอง',
    desc: 'จดหมายแจ้งผลการเรียนหรือพฤติกรรมนักศึกษา',
    content: 'ที่ ศธ ___/___\n\nวันที่ ________\n\nเรื่อง  แจ้งผลการเรียน/พฤติกรรมนักศึกษา\nเรียน  ผู้ปกครองของ ____________\n\nด้วยข้าพเจ้าในฐานะอาจารย์ที่ปรึกษา/ผู้สอนรายวิชา____________\nขอแจ้งให้ทราบเกี่ยวกับ____________ ของนักศึกษา\n\nรหัส: ____________\nชื่อ: ____________\n\nรายละเอียด:\n____________\n\nข้อเสนอแนะ:\n____________\n\nหากมีข้อสงสัย กรุณาติดต่อได้ที่ ____________\n\nขอแสดงความนับถือ\n\n(____________)',
  },
  {
    id: '5', category: 'lesson', name: 'แผนการสอน TQF.3',
    desc: 'โครงสร้างแผนการสอนตามกรอบ TQF.3',
    content: '══════════════════════════════════════\nแผนการสอน (Course Syllabus) - TQF.3\n══════════════════════════════════════\n\n1. ข้อมูลทั่วไป\n   รหัสวิชา: ____________\n   ชื่อวิชา: ____________\n   หน่วยกิต: ___ (___ - ___ - ___)\n   ภาคเรียน: ___/___\n   อาจารย์ผู้สอน: ____________\n\n2. จุดมุ่งหมายรายวิชา\n   ____________\n\n3. วัตถุประสงค์การเรียนรู้ (CLO)\n   CLO1: ____________\n   CLO2: ____________\n   CLO3: ____________\n\n4. เนื้อหารายสัปดาห์\n   สัปดาห์ 1: ____________\n   สัปดาห์ 2: ____________\n   สัปดาห์ 8: สอบกลางภาค\n   สัปดาห์ 16: สอบปลายภาค\n\n5. การวัดและประเมินผล\n   - คะแนนเก็บ: ___%\n   - สอบกลางภาค: ___%\n   - สอบปลายภาค: ___%\n\n6. เกณฑ์การตัดเกรด\n   A: 80-100 | B+: 75-79 | B: 70-74\n   C+: 65-69 | C: 60-64 | D+: 55-59\n   D: 50-54 | F: < 50\n\n7. ตำราและเอกสารอ้างอิง\n   ____________',
  },
  {
    id: '6', category: 'lesson', name: 'แผนการสอนรายสัปดาห์',
    desc: 'แผนจัดการเรียนรู้รายสัปดาห์ละเอียด',
    content: '══════════════════════════════════════\nแผนการจัดการเรียนรู้รายสัปดาห์\n══════════════════════════════════════\n\nวิชา: ____________\nสัปดาห์ที่: ___\nวันที่: ____________\nเวลา: ____________\nห้อง: ____________\n\nหัวข้อ: ____________\n\nวัตถุประสงค์การเรียนรู้:\n1. ____________\n2. ____________\n\nกิจกรรมการเรียนรู้:\n\nขั้นนำ (15 นาที):\n- ____________\n\nขั้นสอน (60 นาที):\n- ____________\n- กิจกรรม: ____________\n\nขั้นสรุป (15 นาที):\n- ____________\n\nการวัดผล:\n- ____________\n\nสื่อ/อุปกรณ์:\n- ____________\n\nงานที่มอบหมาย:\n- ____________',
  },
  {
    id: '7', category: 'lesson', name: 'แผน Active Learning',
    desc: 'แผนการสอนแบบ Active Learning / Flipped Classroom',
    content: '══════════════════════════════════════\nแผนการสอน Active Learning\n══════════════════════════════════════\n\nวิชา: ____________\nหัวข้อ: ____________\nรูปแบบ: [ ] Flipped Classroom [ ] PBL [ ] TBL\n\nก่อนเข้าชั้นเรียน (Pre-class):\n- วิดีโอ: ____________ (___ นาที)\n- บทความ/เอกสาร: ____________\n- Quiz ออนไลน์: ____________\n\nในชั้นเรียน (In-class):\n1. Check Understanding (10 นาที)\n   - Quiz สั้น / ถาม-ตอบ\n2. กิจกรรมกลุ่ม (40 นาที)\n   - ____________\n   - กลุ่มละ ___ คน\n3. นำเสนอ/อภิปราย (20 นาที)\n4. สรุป (10 นาที)\n\nหลังชั้นเรียน (Post-class):\n- Reflection Journal\n- ____________\n\nRubric ประเมิน:\n- การมีส่วนร่วม: ___/10\n- คุณภาพงาน: ___/10\n- การนำเสนอ: ___/10',
  },
  {
    id: '8', category: 'lesson', name: 'แผนการสอนออนไลน์',
    desc: 'แผนจัดการเรียนรู้แบบออนไลน์/Hybrid',
    content: '══════════════════════════════════════\nแผนการสอนออนไลน์ / Hybrid\n══════════════════════════════════════\n\nวิชา: ____________\nหัวข้อ: ____________\nแพลตฟอร์ม: [ ] Zoom [ ] MS Teams [ ] Google Meet\nLMS: [ ] Moodle [ ] Google Classroom [ ] อื่นๆ\n\nก่อนเรียน:\n- อัปโหลดเอกสาร: ____________\n- Pre-test/Quiz: ____________\n\nระหว่างเรียนออนไลน์:\n1. เช็คชื่อ/Warm up (5 นาที)\n2. บรรยาย + สไลด์ (30 นาที)\n3. Breakout Room กิจกรรม (20 นาที)\n4. นำเสนอกลุ่ม (15 นาที)\n5. Q&A + สรุป (10 นาที)\n\nหลังเรียน:\n- ส่งงาน: ____________\n- Post-test: ____________\n- แบบประเมิน: ____________\n\nเครื่องมือเสริม:\n- Mentimeter / Kahoot / Padlet\n- ____________',
  },
  {
    id: '9', category: 'rubric', name: 'Rubric รายงาน/เอกสาร',
    desc: 'เกณฑ์การประเมินรายงานหรือเอกสารวิชาการ',
    content: '══════════════════════════════════════\nRubric ประเมินรายงาน\n══════════════════════════════════════\n\nวิชา: ____________\nงาน: ____________\nคะแนนเต็ม: ___ คะแนน\n\n1. เนื้อหา (___ คะแนน)\n   4 = ครบถ้วน ถูกต้อง มีข้อมูลสนับสนุน\n   3 = ค่อนข้างครบถ้วน ผิดพลาดเล็กน้อย\n   2 = บางส่วนขาดหาย\n   1 = ไม่ครบ ผิดพลาดมาก\n\n2. การวิเคราะห์ (___ คะแนน)\n   4 = ลึกซึ้ง มีหลักฐานอ้างอิง\n   3 = มีเหตุผลดี\n   2 = ผิวเผิน\n   1 = ไม่มีการวิเคราะห์\n\n3. การเขียน (___ คะแนน)\n   4 = สละสลวย ไม่มีข้อผิดพลาด\n   3 = อ่านง่าย ผิดเล็กน้อย\n   2 = พอเข้าใจ ผิดหลายจุด\n   1 = สับสน ผิดมาก\n\n4. การอ้างอิง (___ คะแนน)\n   4 = ถูกต้องครบถ้วนตามรูปแบบ\n   3 = เกือบครบถ้วน\n   2 = มีบางส่วน\n   1 = ไม่มี/ผิดรูปแบบ\n\n5. ความตรงเวลา (___ คะแนน)\n   4 = ส่งก่อนกำหนด\n   3 = ตรงเวลา\n   2 = สายไม่เกิน 1 วัน\n   1 = สายเกิน 1 วัน',
  },
  {
    id: '10', category: 'rubric', name: 'Rubric การนำเสนอ',
    desc: 'เกณฑ์ประเมินการนำเสนอหน้าชั้นเรียน',
    content: '══════════════════════════════════════\nRubric ประเมินการนำเสนอ (Presentation)\n══════════════════════════════════════\n\nวิชา: ____________\nคะแนนเต็ม: ___ คะแนน\nเวลา: ___ นาที\n\n1. เนื้อหา (___%)\n   4 = ครบถ้วน ถูกต้อง มีข้อมูลสนับสนุน\n   3 = ค่อนข้างครบ ผิดพลาดเล็กน้อย\n   2 = ขาดบางส่วน\n   1 = ไม่ครบ ผิดพลาดมาก\n\n2. การนำเสนอ (___%)\n   4 = พูดชัดเจน มั่นใจ สบตาผู้ฟัง\n   3 = พูดค่อนข้างชัด มีจังหวะดี\n   2 = อ่านจากสไลด์\n   1 = ไม่มั่นใจ อ่านตลอด\n\n3. สไลด์/สื่อ (___%)\n   4 = สวยงาม อ่านง่าย\n   3 = เรียบร้อย อ่านได้\n   2 = ข้อมูลแน่นเกินไป\n   1 = อ่านยาก ไม่เป็นระเบียบ\n\n4. การตอบคำถาม (___%)\n   4 = ตอบได้ครบ ถูกต้อง\n   3 = ตอบได้เกือบทุกคำถาม\n   2 = ตอบได้บางคำถาม\n   1 = ตอบไม่ได้\n\n5. การทำงานเป็นทีม (___%)\n   4 = ทุกคนมีส่วนร่วมเท่าเทียม\n   3 = ส่วนใหญ่มีส่วนร่วม\n   2 = บางคนไม่มีส่วนร่วม\n   1 = คนเดียวทำเกือบทั้งหมด',
  },
  {
    id: '11', category: 'rubric', name: 'Rubric โปรเจกต์',
    desc: 'เกณฑ์ประเมิน Project-Based Learning',
    content: '══════════════════════════════════════\nRubric ประเมินโปรเจกต์\n══════════════════════════════════════\n\nวิชา: ____________\nโปรเจกต์: ____________\nคะแนนเต็ม: 100 คะแนน\n\n1. กระบวนการทำงาน (20 คะแนน)\n   - วางแผนเป็นระบบ (5)\n   - แบ่งงานเหมาะสม (5)\n   - ทำตามกำหนดเวลา (5)\n   - มีการปรับปรุงพัฒนา (5)\n\n2. เนื้อหาและคุณภาพ (30 คะแนน)\n   - ตรงตามโจทย์ (10)\n   - ความถูกต้อง (10)\n   - ความคิดสร้างสรรค์ (10)\n\n3. ผลงาน/ชิ้นงาน (25 คะแนน)\n   - ใช้งานได้จริง (10)\n   - ความสมบูรณ์ (10)\n   - คุณภาพการนำเสนอ (5)\n\n4. รายงาน (15 คะแนน)\n   - ความครบถ้วน (5)\n   - การเขียน (5)\n   - การอ้างอิง (5)\n\n5. การทำงานเป็นทีม (10 คะแนน)\n   - ทุกคนมีส่วนร่วม (5)\n   - การสื่อสารในทีม (5)\n\nรวม: ___/100\nเกรด: ___\nความคิดเห็น: ____________',
  },
  {
    id: '12', category: 'announcement', name: 'ประกาศเปลี่ยนแปลงตาราง',
    desc: 'ประกาศเปลี่ยนห้อง/เวลา/วันเรียน',
    content: '══════════════════════════════════════\nประกาศเปลี่ยนแปลงตารางเรียน\n══════════════════════════════════════\n\nวิชา: ____________\nSection: ____________\nอาจารย์ผู้สอน: ____________\n\nเดิม:\n  วัน: ____________\n  เวลา: ____________\n  ห้อง: ____________\n\nใหม่:\n  วัน: ____________\n  เวลา: ____________\n  ห้อง: ____________\n\nมีผลตั้งแต่: ____________\nเหตุผล: ____________\n\nหากมีข้อสงสัย ติดต่อ: ____________\nประกาศ ณ วันที่ ____________',
  },
  {
    id: '13', category: 'announcement', name: 'ประกาศคะแนน/เกรด',
    desc: 'ประกาศผลคะแนนสอบหรือเกรด',
    content: '══════════════════════════════════════\nประกาศผลคะแนน\n══════════════════════════════════════\n\nวิชา: ____________\nSection: ____________\nประเภท: [ ] สอบย่อย [ ] กลางภาค [ ] ปลายภาค\n\nสถิติภาพรวม:\n- คะแนนเต็ม: ___\n- คะแนนสูงสุด: ___\n- คะแนนต่ำสุด: ___\n- คะแนนเฉลี่ย: ___\n\nการดูคะแนน:\n- ตรวจสอบที่: ____________\n- ช่วงเวลา: ____________\n\nขอดูกระดาษคำตอบ:\n- วันที่: ____________\n- สถานที่: ____________\n\nหมดเขตยื่นคำร้อง: ____________\nประกาศ ณ วันที่ ____________',
  },
  {
    id: '14', category: 'announcement', name: 'ประกาศงดเรียน',
    desc: 'แจ้งงดการเรียนการสอน',
    content: '══════════════════════════════════════\nประกาศงดการเรียนการสอน\n══════════════════════════════════════\n\nวิชา: ____________\nSection: ____________\nอาจารย์ผู้สอน: ____________\n\nงดเรียนวันที่: ____________\nเหตุผล: ____________\n\nสิ่งที่นักศึกษาต้องทำ:\n1. ____________\n2. ____________\n3. ____________\n\nวันชดเชย: ____________\nเวลา: ____________\nห้อง: ____________\n\nขออภัยในความไม่สะดวก\nประกาศ ณ วันที่ ____________',
  },
  {
    id: '15', category: 'announcement', name: 'ประกาศรับสมัคร TA',
    desc: 'ประกาศรับสมัครผู้ช่วยสอน/ผู้ช่วยวิจัย',
    content: '══════════════════════════════════════\nประกาศรับสมัครผู้ช่วย\n══════════════════════════════════════\n\nตำแหน่ง: [ ] ผู้ช่วยสอน (TA) [ ] ผู้ช่วยวิจัย (RA)\nรายวิชา/โครงการ: ____________\nอาจารย์ที่ปรึกษา: ____________\n\nคุณสมบัติ:\n1. นักศึกษาชั้นปี ___ ขึ้นไป\n2. เกรดเฉลี่ยไม่ต่ำกว่า ___\n3. ____________\n\nลักษณะงาน:\n- ____________\n- ____________\n\nค่าตอบแทน: ____________\nระยะเวลา: ____________\nจำนวนที่รับ: ___ คน\n\nวิธีสมัคร: ____________\nหมดเขตรับสมัคร: ____________',
  },
  {
    id: '16', category: 'report', name: 'รายงานสรุปผลการสอน',
    desc: 'รายงานสรุปผลการจัดการเรียนการสอนรายภาค',
    content: '══════════════════════════════════════\nรายงานสรุปผลการจัดการเรียนการสอน\n══════════════════════════════════════\n\nวิชา: ____________\nภาคเรียน: ___/___\nอาจารย์ผู้สอน: ____________\n\n1. ข้อมูลทั่วไป\n   - จำนวนนักศึกษาลงทะเบียน: ___ คน\n   - จำนวน W: ___ คน\n   - สอบผ่าน: ___ คน (___%)   \n   - สอบตก: ___ คน (___%)  \n\n2. การกระจายเกรด\n   A: ___ | B+: ___ | B: ___ | C+: ___ | C: ___\n   D+: ___ | D: ___ | F: ___\n   GPA เฉลี่ย: ___\n\n3. สรุปผลการดำเนินงาน\n   ____________\n\n4. ปัญหาและอุปสรรค\n   ____________\n\n5. แนวทางการปรับปรุง\n   ____________\n\nลงชื่อ ____________\nวันที่ ____________',
  },
  {
    id: '17', category: 'report', name: 'รายงาน มคอ.5',
    desc: 'รายงานผลการดำเนินการ มคอ.5',
    content: '══════════════════════════════════════\nรายงานผลการดำเนินการ (มคอ.5)\n══════════════════════════════════════\n\nหมวดที่ 1 ข้อมูลทั่วไป\n   รหัสวิชา: ____________\n   ชื่อวิชา: ____________\n   ภาคเรียน: ___/___\n   อาจารย์ผู้รับผิดชอบ: ____________\n\nหมวดที่ 2 เปรียบเทียบกับแผน\n   2.1 สิ่งที่ไม่ได้ดำเนินการตามแผน:\n   ____________\n   2.2 สิ่งที่ดำเนินการเพิ่มเติม:\n   ____________\n\nหมวดที่ 3 สรุปผล\n   3.1 จำนวนนักศึกษา: ลงทะเบียน ___ สอบ ___ ผ่าน ___\n   3.2 เกรดเฉลี่ย: ___\n   3.3 ผลลัพธ์การเรียนรู้ตาม CLO:\n   ____________\n\nหมวดที่ 4 ปัญหาและผลกระทบ\n   ____________\n\nหมวดที่ 5 การปรับปรุง\n   5.1 ข้อเสนอแนะ: ____________\n   5.2 แผนปรับปรุง: ____________',
  },
  {
    id: '18', category: 'report', name: 'รายงานการประชุม',
    desc: 'บันทึกการประชุมอาจารย์/คณะกรรมการ',
    content: '══════════════════════════════════════\nรายงานการประชุม\n══════════════════════════════════════\n\nการประชุม: ____________ ครั้งที่ ___/___\nวันที่: ____________\nเวลา: ____________ - ____________\nสถานที่: ____________\n\nผู้เข้าร่วม:\n1. ____________ (ประธาน)\n2. ____________\n3. ____________\nผู้จดรายงาน: ____________\n\nวาระที่ 1: เรื่องแจ้งเพื่อทราบ\n- ____________\n\nวาระที่ 2: รับรองรายงานครั้งที่ ___\nมติ: ____________\n\nวาระที่ 3: เรื่องสืบเนื่อง\n- ____________\nมติ: ____________\n\nวาระที่ 4: เรื่องเสนอพิจารณา\n- ____________\nมติ: ____________\n\nวาระที่ 5: เรื่องอื่นๆ\n- ____________\n\nปิดประชุมเวลา: ____________\n\nลงชื่อ ____________ (ผู้จดรายงาน)\nลงชื่อ ____________ (ประธาน)',
  },
  {
    id: '19', category: 'report', name: 'รายงานโครงการ/กิจกรรม',
    desc: 'สรุปผลโครงการ/กิจกรรมพิเศษ',
    content: '══════════════════════════════════════\nรายงานสรุปผลโครงการ/กิจกรรม\n══════════════════════════════════════\n\nชื่อโครงการ: ____________\nผู้รับผิดชอบ: ____________\nวันที่จัด: ____________\nสถานที่: ____________\n\n1. หลักการและเหตุผล\n   ____________\n\n2. วัตถุประสงค์\n   2.1 ____________\n   2.2 ____________\n\n3. กลุ่มเป้าหมาย\n   - จำนวน: ___ คน\n   - เข้าร่วมจริง: ___ คน\n\n4. งบประมาณ\n   - งบที่ได้รับ: ___ บาท\n   - งบที่ใช้จริง: ___ บาท\n   - คงเหลือ: ___ บาท\n\n5. สรุปผลการดำเนินงาน\n   ____________\n\n6. ผลการประเมินความพึงพอใจ\n   - คะแนนเฉลี่ย: ___/5.00\n\n7. ปัญหาและข้อเสนอแนะ\n   ____________\n\nผู้จัดทำรายงาน: ____________\nวันที่: ____________',
  },
];

export default function TemplateLibrary() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const copyTemplate = (template) => {
    navigator.clipboard.writeText(template.content);
    toast.success('คัดลอก "' + template.name + '" แล้ว');
  };

  const getCategoryInfo = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[0];

  const btnStyle = {
    padding: '10px 24px', border: 'none', borderRadius: 12,
    background: 'linear-gradient(135deg, ' + CI.cyan + ', ' + CI.magenta + ')',
    color: '#fff', fontFamily: FONT, fontSize: 16, cursor: 'pointer', fontWeight: 600,
  };

  const inputStyle = {
    padding: '10px 14px', border: '2px solid ' + CI.cyan + '33', borderRadius: 10,
    background: '#16163a', color: '#fff', fontFamily: FONT, fontSize: 15, outline: 'none', width: '100%',
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.04)', borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.08)', padding: 20, marginBottom: 16,
  };

  return (
    <div style={{ fontFamily: FONT, color: '#fff', minHeight: '100vh', padding: '24px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, margin: 0, background: 'linear-gradient(135deg, ' + CI.cyan + ', ' + CI.magenta + ')', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Template Library
          </h2>
          <p style={{ fontSize: 15, color: '#aaa', marginTop: 6 }}>คลัง Template สำหรับงานอาจารย์ — จดหมาย แผนการสอน Rubric ประกาศ รายงาน</p>
        </div>

        <div style={{ maxWidth: 500, margin: '0 auto 20px' }}>
          <input style={inputStyle} placeholder="ค้นหา Template..." value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value); }} />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          {CATEGORIES.map(function(cat) {
            return (
              <button key={cat.key} onClick={function() { setSelectedCategory(cat.key); }}
                style={{
                  padding: '8px 16px', border: 'none', borderRadius: 12, fontFamily: FONT, fontSize: 15, cursor: 'pointer', fontWeight: 600,
                  background: selectedCategory === cat.key ? 'linear-gradient(135deg, ' + CI.cyan + ', ' + CI.magenta + ')' : 'rgba(255,255,255,0.08)',
                  color: selectedCategory === cat.key ? '#fff' : '#aaa',
                }}>
                {cat.icon} {cat.label}
                <span style={{ marginLeft: 6, fontSize: 13, opacity: 0.7 }}>
                  ({TEMPLATES.filter(function(t) { return cat.key === 'all' || t.category === cat.key; }).length})
                </span>
              </button>
            );
          })}
        </div>

        {filteredTemplates.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: 50 }}>
            <p style={{ fontSize: 18, color: '#888' }}>ไม่พบ Template ที่ค้นหา</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filteredTemplates.map(function(template) {
              var cat = getCategoryInfo(template.category);
              return (
                <div key={template.id} style={{
                  ...cardStyle, display: 'flex', flexDirection: 'column', cursor: 'pointer',
                }}
                  onClick={function() { setPreviewTemplate(template); }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, background: CI.cyan + '22', color: CI.cyan, padding: '2px 10px', borderRadius: 8 }}>
                      {cat.icon} {cat.label}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 17, margin: '0 0 6px', color: '#fff' }}>{template.name}</h4>
                  <p style={{ fontSize: 14, color: '#aaa', margin: 0, flex: 1 }}>{template.desc}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button onClick={function(e) { e.stopPropagation(); setPreviewTemplate(template); }}
                      style={{ ...btnStyle, fontSize: 14, padding: '8px 14px', flex: 1 }}>
                      ดูตัวอย่าง
                    </button>
                    <button onClick={function(e) { e.stopPropagation(); copyTemplate(template); }}
                      style={{ ...btnStyle, fontSize: 14, padding: '8px 14px', flex: 1, background: CI.gold, color: CI.dark }}>
                      ใช้ Template
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {previewTemplate && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }} onClick={function() { setPreviewTemplate(null); }}>
            <div style={{
              background: CI.dark, borderRadius: 20, maxWidth: 700, width: '100%', maxHeight: '90vh',
              overflow: 'hidden', border: '1px solid ' + CI.cyan + '33',
            }} onClick={function(e) { e.stopPropagation(); }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 20, margin: 0, color: CI.cyan }}>{previewTemplate.name}</h3>
                  <p style={{ fontSize: 14, color: '#aaa', margin: '4px 0 0' }}>{previewTemplate.desc}</p>
                </div>
                <button onClick={function() { setPreviewTemplate(null); }}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 8 }}>X</button>
              </div>
              <div style={{ padding: 24, maxHeight: 'calc(90vh - 140px)', overflowY: 'auto' }}>
                <pre style={{
                  background: '#0a0a1a', borderRadius: 12, padding: 20, fontSize: 15, lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#e0e0e0', fontFamily: FONT,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {previewTemplate.content}
                </pre>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={function() { copyTemplate(previewTemplate); }} style={btnStyle}>
                  ใช้ Template
                </button>
                <button onClick={function() { setPreviewTemplate(null); }} style={{ ...btnStyle, background: 'rgba(255,255,255,0.1)' }}>
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}