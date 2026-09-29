// data.js — Bé Nấu Ăn: nội dung giáo dục (món ăn, các bước, ai làm, mẹo, điều bé học được, nhiệm vụ ở nhà) và phần thưởng.
// Mỗi bước có who: 'kid' (bé tự làm được), 'adult' (ba mẹ làm: dao, bếp nóng, đồ nóng), 'both' (bé làm cùng ba mẹ).
// Phần tương tác 3D của từng bước nằm trong recipes-*.js, khớp theo thứ tự các bước ở đây.

export const RECIPES = [
  { id: 'com', name: 'Cơm trắng', desc: 'Hạt cơm trắng dẻo thơm', color: '#FFF3D6',
    steps: [
      { who: 'kid', text: 'Đong 2 cốc gạo vào nồi' },
      { who: 'kid', text: 'Vo gạo, chắt bỏ nước đục' },
      { who: 'kid', text: 'Đổ nước cao hơn gạo một đốt ngón tay' },
      { who: 'kid', text: 'Đặt nồi vào nồi cơm điện' },
      { who: 'both', text: 'Ba mẹ cắm điện, bé bấm nút nấu' },
      { who: 'kid', text: 'Chờ cơm chín, nghe tiếng "tách"' },
      { who: 'both', text: 'Xới cơm cho tơi (cẩn thận hơi nóng)' },
    ],
    tip: 'Đổ nước cao hơn mặt gạo khoảng một đốt ngón tay là cơm vừa dẻo.',
    fact: 'Cơm cho bé năng lượng để chạy nhảy cả ngày.',
    mission: 'Giúp ba mẹ đong gạo, vo gạo và đổ nước nấu cơm.',
    quiz: { q: 'Cơm được nấu từ gì?', a: 'gao', options: ['gao', 'cam', 'trung'] } },

  { id: 'cam', name: 'Nước cam vắt', desc: 'Mát lạnh, ngọt thơm', color: '#FFB347',
    steps: [
      { who: 'kid', text: 'Rửa sạch quả cam' },
      { who: 'adult', text: 'Ba mẹ cắt đôi quả cam (dao sắc)' },
      { who: 'kid', text: 'Vắt cam lấy nước' },
      { who: 'kid', text: 'Rót nước cam vào cốc' },
      { who: 'kid', text: 'Thêm một thìa đường, khuấy đều' },
      { who: 'kid', text: 'Thả đá vào cốc' },
    ],
    tip: 'Rửa cam thật sạch trước khi cắt để vỏ không làm bẩn nước cam.',
    fact: 'Cam có nhiều vitamin C giúp bé khỏe, ít bị ốm.',
    mission: 'Vắt cam và khuấy nước cam giúp ba mẹ.',
    quiz: { q: 'Nước cam làm từ quả gì?', a: 'cam', options: ['chuoi', 'cam', 'bi'] } },

  { id: 'trung', name: 'Trứng chiên hành', desc: 'Vàng ươm, thơm lừng', color: '#FFC93C',
    steps: [
      { who: 'kid', text: 'Đập trứng vào bát' },
      { who: 'adult', text: 'Ba mẹ cắt hành lá' },
      { who: 'kid', text: 'Cho hành vào bát trứng' },
      { who: 'kid', text: 'Nêm 2 giọt nước mắm' },
      { who: 'kid', text: 'Đánh đều trứng' },
      { who: 'adult', text: 'Ba mẹ chiên trứng (bếp nóng)' },
      { who: 'kid', text: 'Bày trứng ra đĩa thật đẹp' },
    ],
    tip: 'Đập trứng ra một bát riêng trước để xem trứng có còn ngon không.',
    fact: 'Trứng giúp bé cao lớn, khỏe mạnh.',
    mission: 'Đập trứng và đánh trứng giúp ba mẹ.',
    quiz: { q: 'Món này làm từ gì?', a: 'trung', options: ['trung', 'chuoi', 'tom'] } },

  { id: 'banhmi', name: 'Bánh mì ốp la', desc: 'Bữa sáng giòn thơm', color: '#E8A04C',
    steps: [
      { who: 'kid', text: 'Rửa dưa leo và rau xà lách' },
      { who: 'adult', text: 'Ba mẹ cắt dưa leo, xẻ bánh mì' },
      { who: 'kid', text: 'Đập trứng vào chảo (chưa bật bếp)' },
      { who: 'adult', text: 'Ba mẹ ốp la trứng' },
      { who: 'kid', text: 'Kẹp rau, dưa leo, trứng vào bánh mì' },
      { who: 'kid', text: 'Rưới 2 giọt xì dầu' },
    ],
    tip: 'Chỉ đập trứng vào chảo khi bếp chưa bật, rồi nhờ ba mẹ bật bếp.',
    fact: 'Ăn sáng đầy đủ giúp bé học giỏi, chơi vui.',
    mission: 'Rửa rau và kẹp bánh mì giúp ba mẹ.',
    quiz: { q: 'Bánh mì ốp la có trứng không?', a: 'trung', options: ['bi', 'trung', 'cam'] } },

  { id: 'goicuon', name: 'Gỏi cuốn', desc: 'Tôm hồng, rau xanh mát', color: '#FF9E9E',
    steps: [
      { who: 'kid', text: 'Rửa rau sống thật sạch' },
      { who: 'kid', text: 'Nhặt rau: lá xanh để lại, lá úa bỏ đi' },
      { who: 'adult', text: 'Ba mẹ luộc tôm và thịt' },
      { who: 'kid', text: 'Nhúng bánh tráng qua nước cho mềm' },
      { who: 'kid', text: 'Xếp rau, bún, thịt, tôm lên bánh tráng' },
      { who: 'kid', text: 'Cuộn thật chặt tay' },
      { who: 'kid', text: 'Bày gỏi cuốn ra đĩa cùng chén nước chấm' },
    ],
    tip: 'Nhúng bánh tráng thật nhanh qua nước, để một lát là bánh tự mềm.',
    fact: 'Rau xanh giúp bé tiêu hóa tốt, da dẻ hồng hào.',
    mission: 'Nhặt rau và cuốn gỏi cuốn cùng ba mẹ.',
    quiz: { q: 'Con gì màu hồng trong gỏi cuốn?', a: 'tom', options: ['tom', 'trung', 'gao'] } },

  { id: 'canhbi', name: 'Canh bí đỏ', desc: 'Ngọt mát, màu cam xinh', color: '#FF9A3D',
    steps: [
      { who: 'kid', text: 'Rửa quả bí đỏ' },
      { who: 'adult', text: 'Ba mẹ gọt vỏ, cắt bí thành miếng' },
      { who: 'kid', text: 'Đổ nước vào nồi' },
      { who: 'kid', text: 'Cho bí vào nồi (nồi chưa bật bếp)' },
      { who: 'adult', text: 'Ba mẹ nấu canh, nêm vừa ăn' },
      { who: 'adult', text: 'Ba mẹ múc canh ra bát (nóng)' },
      { who: 'kid', text: 'Rắc hành, ngò lên bát canh' },
    ],
    tip: 'Cho bí vào nồi nước lạnh trước, rồi ba mẹ mới bật bếp.',
    fact: 'Bí đỏ có màu cam đẹp, rất tốt cho đôi mắt của bé.',
    mission: 'Rửa bí và rắc hành ngò giúp ba mẹ.',
    quiz: { q: 'Canh này nấu từ quả gì?', a: 'bi', options: ['cam', 'bi', 'chuoi'] } },

  { id: 'raumuong', name: 'Rau muống xào tỏi', desc: 'Xanh giòn, thơm tỏi', color: '#5DBB46',
    steps: [
      { who: 'kid', text: 'Nhặt rau muống, ngắt thành khúc' },
      { who: 'kid', text: 'Rửa rau thật sạch' },
      { who: 'kid', text: 'Bóc vỏ tỏi' },
      { who: 'adult', text: 'Ba mẹ xào rau trên bếp lửa lớn' },
      { who: 'kid', text: 'Đưa đĩa cho ba mẹ bày rau' },
    ],
    tip: 'Ngắt rau bằng tay, chỗ nào bẻ gãy giòn là phần rau non ngon.',
    fact: 'Rau muống có nhiều chất xơ giúp bụng bé khỏe.',
    mission: 'Nhặt rau muống và bóc tỏi giúp ba mẹ.',
    quiz: { q: 'Món này là rau gì?', a: 'rau', options: ['rau', 'tom', 'cam'] } },

  { id: 'thitkho', name: 'Thịt kho trứng', desc: 'Nước kho màu cánh gián', color: '#B5651D',
    steps: [
      { who: 'adult', text: 'Ba mẹ luộc trứng' },
      { who: 'kid', text: 'Bóc vỏ trứng (trứng đã nguội)' },
      { who: 'adult', text: 'Ba mẹ cắt thịt thành miếng' },
      { who: 'kid', text: 'Ướp thịt: 2 thìa nước mắm, 1 thìa đường' },
      { who: 'kid', text: 'Trộn đều cho thịt ngấm' },
      { who: 'kid', text: 'Cho trứng vào nồi thịt' },
      { who: 'adult', text: 'Ba mẹ kho lửa nhỏ thật lâu' },
    ],
    tip: 'Kho lửa nhỏ thật lâu thì thịt mềm và nước kho có màu cánh gián đẹp.',
    fact: 'Thịt kho trứng là món quen thuộc trong mâm cơm ngày Tết.',
    mission: 'Bóc trứng và trộn thịt ướp giúp ba mẹ.',
    quiz: { q: 'Món kho này có thịt và gì?', a: 'trung', options: ['cam', 'trung', 'bi'] } },

  { id: 'che', name: 'Chè chuối', desc: 'Béo ngậy nước cốt dừa', color: '#F7E08A',
    steps: [
      { who: 'kid', text: 'Bóc vỏ chuối' },
      { who: 'kid', text: 'Cắt chuối bằng dao nhựa' },
      { who: 'adult', text: 'Ba mẹ nấu chuối với nước cốt dừa' },
      { who: 'adult', text: 'Ba mẹ múc chè ra bát (nóng)' },
      { who: 'kid', text: 'Rắc đậu phộng và mè' },
    ],
    tip: 'Bé dùng dao nhựa để cắt những thứ mềm như chuối. Dao thật để ba mẹ dùng.',
    fact: 'Chuối có nhiều năng lượng, ăn vào là có sức chơi ngay.',
    mission: 'Bóc chuối và cắt chuối bằng dao nhựa.',
    quiz: { q: 'Chè này nấu từ quả gì?', a: 'chuoi', options: ['chuoi', 'bi', 'cam'] } },

  { id: 'pho', name: 'Phở bò', desc: 'Nước dùng thơm quế hồi', color: '#E9B872',
    steps: [
      { who: 'adult', text: 'Ba mẹ ninh nước dùng với quế, hồi, gừng' },
      { who: 'kid', text: 'Cho bánh phở vào tô' },
      { who: 'kid', text: 'Xếp thịt bò lên trên' },
      { who: 'kid', text: 'Rắc hành lá và ngò' },
      { who: 'adult', text: 'Ba mẹ chan nước dùng nóng' },
      { who: 'kid', text: 'Thêm rau thơm, vắt chanh' },
    ],
    tip: 'Quế, hồi và gừng nướng làm nước phở thơm lừng.',
    fact: 'Phở là món ăn nổi tiếng của Việt Nam, bạn bè khắp thế giới đều biết.',
    mission: 'Xếp thịt, rắc hành và vắt chanh cho bát phở.',
    quiz: { q: 'Phở có sợi gì?', a: 'pho', options: ['pho', 'gao', 'cam'] } },

  { id: 'mamcom', name: 'Mâm cơm gia đình', desc: 'Cả nhà quây quần', color: '#FF7FAA',
    steps: [
      { who: 'kid', text: 'Bày các món lên mâm' },
      { who: 'kid', text: 'Xếp bát, đũa cho mỗi người' },
      { who: 'kid', text: 'Mời ông bà, ba mẹ ăn cơm' },
    ],
    tip: 'Mời ông bà trước, rồi mới mời ba mẹ. Nói "Con mời ông ăn cơm ạ!" thật lễ phép.',
    fact: 'Cả nhà quây quần bên mâm cơm là lúc vui nhất trong ngày.',
    mission: 'Dọn mâm, xếp bát đũa và mời cả nhà ăn cơm.',
    quiz: null },
];

export const WHO = {
  kid: { label: 'Bé làm được', cls: 'kid' },
  adult: { label: 'Ba mẹ làm', cls: 'adult' },
  both: { label: 'Làm cùng ba mẹ', cls: 'both' },
};

// Hình minh hoạ đơn giản cho câu đố
export const FOODS = {
  gao: 'Gạo', cam: 'Quả cam', trung: 'Quả trứng', chuoi: 'Quả chuối', bi: 'Bí đỏ', tom: 'Con tôm', rau: 'Rau muống', pho: 'Bánh phở',
};

// Phần thưởng: sau khi nấu xong số món này lần đầu → thăng cấp + quà đồ đầu bếp cho bé trong bếp
export const MILESTONES = {
  2: { gift: 'apron', name: 'Tạp dề hồng' },
  4: { gift: 'hat', name: 'Mũ đầu bếp' },
  6: { gift: 'ladle', name: 'Muôi vàng' },
  8: { gift: 'badge', name: 'Huy hiệu ngôi sao' },
  10: { gift: 'crown', name: 'Mũ Bếp Trưởng' },
  11: { gift: 'trophy', name: 'Cúp Siêu Đầu Bếp' },
};
export const RANKS = ['Phụ Bếp Nhí', 'Bé Tập Nấu', 'Đầu Bếp Tí Hon', 'Đầu Bếp Giỏi', 'Bếp Trưởng Nhí', 'Siêu Đầu Bếp', 'Siêu Đầu Bếp Nhà Ta'];

export const FAMILY = [
  { id: 'ong', name: 'ông', call: 'Con mời ông ăn cơm ạ!', reply: 'Ừ, cháu ngoan quá!' },
  { id: 'ba_noi', name: 'bà', call: 'Con mời bà ăn cơm ạ!', reply: 'Cháu bà giỏi quá!' },
  { id: 'ba', name: 'ba', call: 'Con mời ba ăn cơm ạ!', reply: 'Cảm ơn con yêu!' },
  { id: 'me', name: 'mẹ', call: 'Con mời mẹ ăn cơm ạ!', reply: 'Con nấu ngon quá!' },
];

export const PRAISE_COOK = ['Giỏi quá!', 'Khéo tay quá!', 'Tuyệt vời!', 'Đầu bếp nhí đây rồi!', 'Hay lắm!'];
export const YUM = ['Mmm, ngon quá!', 'Thơm quá đi!', 'Trông ngon quá!', 'Ngon tuyệt!'];

// Tiến trình
export const doneCount = save => RECIPES.filter(r => save.stars[r.id]).length;
export const unlockedIndex = save => { let i = 0; while (i < RECIPES.length && save.stars[RECIPES[i].id]) i++; return i; }; // món mở tiếp theo
export const playable = (save, i) => i <= unlockedIndex(save) || !!save.stars[RECIPES[i].id];
export const rankOf = save => 1 + Object.keys(MILESTONES).filter(n => doneCount(save) >= +n).length;
export const giftsOf = save => Object.entries(MILESTONES).filter(([n]) => doneCount(save) >= +n).map(([, m]) => m.gift);
export const starsFromQuality = q => (q >= 0.9 ? 3 : q >= 0.6 ? 2 : 1);
