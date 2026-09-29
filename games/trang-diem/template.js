// template.js — khung HTML của Tiệm Trang Điểm (được gắn vào gốc game khi mở)
export const TEMPLATE = `

  <!-- MÀN HÌNH CHÍNH -->
  <section id="home" class="screen">
    <div class="home-top">
      <div class="home-left">
        <button class="round-btn" id="toHub" aria-label="Về trang chọn game"></button>
        <button class="round-btn" id="homeGear" aria-label="Dành cho bố mẹ (giữ để mở)"><span class="gear-ring"></span></button>
      </div>
      <div class="toggles"></div>
    </div>
    <h1 class="logo"><span class="logo-sm">Tiệm Trang Điểm</span><span class="logo-lg">Bé Na</span></h1>
    <div class="home-hero">
      <div class="hero-mirror" id="heroChar"></div>
      <div class="rank-chip" id="homeRank"></div>
    </div>
    <nav class="home-actions">
      <button class="big-btn play" id="btnPlay"><span class="ico"></span><span>Chơi</span></button>
      <button class="big-btn free" id="btnFree"><span class="ico"></span><span>Tự do</span></button>
      <button class="big-btn album" id="btnAlbum"><span class="ico"></span><span>Album</span></button>
    </nav>
  </section>

  <!-- BẢN ĐỒ MÀN CHƠI -->
  <section id="map" class="screen" hidden>
    <header class="bar">
      <button class="round-btn" data-go="home" aria-label="Về nhà"></button>
      <div class="bar-title">Chọn màn chơi</div>
      <div class="rank-chip small" id="mapRank"></div>
    </header>
    <div class="map-scroll" id="mapScroll"><div class="map-track" id="mapTrack"></div></div>
  </section>

  <!-- BÀN TRANG ĐIỂM -->
  <section id="play" class="screen" hidden>
    <header class="bar">
      <button class="round-btn" id="playBack" aria-label="Quay lại"></button>
      <div class="bar-title" id="playTitle"></div>
      <div class="char-pick" id="charPick"></div>
      <div class="toggles"></div>
    </header>
    <div class="stage-wrap">
      <div class="mirror"><div class="glass" id="stage"></div></div>
      <button class="order-card" id="orderCard" aria-label="Xem mẫu trang điểm"></button>
      <div class="bubble" id="bubble" aria-live="polite"></div>
      <button class="camera-btn" id="btnCamera" aria-label="Chụp ảnh"></button>
    </div>
    <div class="tray">
      <div class="palette" id="palette"></div>
      <div class="tools" id="tools"></div>
    </div>
  </section>

  <!-- ALBUM ẢNH -->
  <section id="album" class="screen" hidden>
    <header class="bar">
      <button class="round-btn" data-go="home" aria-label="Về nhà"></button>
      <div class="bar-title">Album ảnh của bé</div>
      <div class="bar-count" id="albumCount"></div>
    </header>
    <div class="album-grid" id="albumGrid"></div>
  </section>

  <div class="modal" id="modal" hidden><div class="modal-card" id="modalCard"></div></div>
  <div class="flash" id="flash"></div>
  <div class="brush" id="brush" hidden></div>
  <div class="hand" id="hand" hidden></div>
`;
