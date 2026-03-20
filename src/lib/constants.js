// ===================================================
// Constants — Categories, Platforms, Tones, Headlines
// Shared between client and server
// ===================================================

export const CATEGORY_TAGS = {
  "คณะบริหารธุรกิจ (ภาพรวม)": "#เปลี่ยนฝันปั้นธุรกิจ\n#คณะบริหารธุรกิจ #มหาวิทยาลัยศรีปทุม\n#เรียนกับตัวจริงประสบการณ์จริง\n#SPUBUS #SPU #SripatumUniversity\n#SripatumBusinessSchool",
  "สาขาการบริหารและการจัดการสมัยใหม่": "#เปลี่ยนฝันปั้นธุรกิจ\n#คณะบริหารธุรกิจ #มหาวิทยาลัยศรีปทุม\n#สาขาวิชาการบริหารและการจัดการสมัยใหม่\n#เรียนกับตัวจริงประสบการณ์จริง\n#SPUBUS #SPU #SripatumUniversity\n#SripatumBusinessSchool",
  "สาขาการตลาดดิจิทัล": "#เปลี่ยนฝันปั้นธุรกิจ\n#คณะบริหารธุรกิจ #มหาวิทยาลัยศรีปทุม\n#สาขาวิชาการตลาดดิจิทัล\n#เรียนกับตัวจริงประสบการณ์จริง\n#SPUBUS #SPU #SripatumUniversity\n#SripatumBusinessSchool",
  "สาขาธุรกิจระหว่างประเทศ": "#เปลี่ยนฝันปั้นธุรกิจ\n#คณะบริหารธุรกิจ #มหาวิทยาลัยศรีปทุม\n#สาขาวิชาธุรกิจระหว่างประเทศ\n#เรียนกับตัวจริงประสบการณ์จริง\n#SPUBUS #SPU #SripatumUniversity\n#SripatumBusinessSchool",
  "สาขาบริหารธุรกิจ": "#เปลี่ยนฝันปั้นธุรกิจ\n#คณะบริหารธุรกิจ #มหาวิทยาลัยศรีปทุม\n#สาขาวิชาบริหารธุรกิจ\n#เรียนกับตัวจริงประสบการณ์จริง\n#SPUBUS #SPU #SripatumUniversity\n#SripatumBusinessSchool",
  "ศูนย์บ่มเพาะธุรกิจ": "#BusinessIncubator\n#ศูนย์บ่มเพาะธุรกิจ #คณะบริหารธุรกิจ\n#มหาวิทยาลัยศรีปทุม #SPUBUS #SPU",
  "กิจการนักศึกษา": "#StudentAffairs\n#กิจการนักศึกษา #คณะบริหารธุรกิจ\n#มหาวิทยาลัยศรีปทุม #SPUBUS #SPU"
};

export const CATEGORIES = Object.keys(CATEGORY_TAGS);

export const HEADLINES = [
  "โปรโมทหลักสูตรและเปิดรับสมัครนักศึกษาใหม่",
  "แนะนำจุดเด่นและบรรยากาศการเรียนการสอนของคณะ",
  "แชร์ความสำเร็จและประสบการณ์ของศิษย์เก่า/นักศึกษาปัจจุบัน",
  "ประชาสัมพันธ์กิจกรรม โครงการ หรือเวิร์กชอปของคณะ",
  "ให้ความรู้ ทริคทางธุรกิจ หรือเทรนด์ใหม่ๆ ที่น่าสนใจ",
  "เชิญชวนร่วมงาน Open House และแนะแนวการศึกษา",
  "ประกาศข่าวสารและความร่วมมือกับองค์กรธุรกิจชั้นนำ",
];

export const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png' },
  { id: 'line', name: 'LINE', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg' },
  { id: 'instagram', name: 'Instagram', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png' },
  { id: 'tiktok', name: 'TikTok', iconUrl: 'https://cdn.iconscout.com/icon/free/png-256/tiktok-2270636-1891163.png' },
  { id: 'lemon8', name: 'Lemon8', iconUrl: null },
  { id: 'youtube', name: 'YouTube', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg' },
];

export const TONES = [
  { id: 'professional', name: 'ทางการ น่าเชื่อถือ', icon: '💼' },
  { id: 'fun', name: 'สนุกสนาน เป็นกันเอง', icon: '🎉' },
  { id: 'concise', name: 'สั้น กระชับ ตรงประเด็น', icon: '⚡' },
  { id: 'emoji', name: 'เน้นอิโมจิ สีสันสะดุดตา', icon: '🎨' }
];

export const PLATFORM_POST_URLS = {
  facebook: 'https://www.facebook.com/',
  line: 'https://timeline.line.me/',
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/upload',
  lemon8: 'https://www.lemon8-app.com/',
  youtube: 'https://studio.youtube.com/',
};
