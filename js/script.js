(() => {
  const config = window.WEDDING_CONFIG || {};
  const $ = id => document.getElementById(id);
  const bride = config.bride || {}, groom = config.groom || {};
  const brideName = bride.firstName || "Eva", groomName = groom.firstName || "Bobby";
  const couple = `${brideName} & ${groomName}`;
  const eventDate = new Date(config.date || "2026-12-12T08:00:00+07:00");
  const safeText = value => value == null ? "" : String(value);
  const setText = (id, value) => { const el = $(id); if (el && value != null) el.textContent = value; };

  // Nama tamu personal dari URL: ?to=Nama%20Tamu
  const params = new URLSearchParams(location.search);
  const guest = (params.get("to") || "").replace(/[<>]/g, "").trim();
  setText("guestName", guest || "Tamu Undangan");
  if ($("rsvpName") && guest) $("rsvpName").value = guest;

  // Nama pasangan dan identitas
  ["coverBride"].forEach(id => setText(id, brideName));
  ["coverGroom"].forEach(id => setText(id, groomName));
  setText("heroBride", brideName); setText("heroGroom", groomName);
  setText("brideFullName", bride.fullName || "Ns. Eva Chyntia Riani Sipayung, S.Kep");
  setText("groomFullName", groom.fullName || "Bobby Purba");
  setText("footerNames", couple); setText("footerBrand", `${couple.toUpperCase()} — THE WEDDING`);
  setText("footerYear", `© ${eventDate.getFullYear()}`);
  setText("heroDate", config.dateLabel || "SATURDAY, 12 DECEMBER 2026");
  setText("coverDate", config.coverDateLabel || eventDate.toLocaleDateString("id-ID", {day:"2-digit",month:"2-digit",year:"numeric"}).replaceAll("/", " . "));
  setText("countdownDate", eventDate.toLocaleDateString("en-US", {day:"numeric",month:"long",year:"numeric"}).toUpperCase());

  // Jadwal akad dan resepsi ditampilkan terpisah sesuai data pada HTML sumber.
  setText("akadDate", config.akadDate || config.dateIndonesian || "Jumat, 12 Desember 2026");
  setText("receptionDate", config.receptionDate || "Minggu, 20 Juni 2027");
  setText("akadTime", config.akadTime || "08.00 – 10.00 WIB");
  setText("receptionTime", config.receptionTime || "11.00 – selesai WIB");
  ["akadVenue", "receptionVenue"].forEach(id => setText(id, config.venue || "[Nama Gedung / Lokasi]"));
  ["akadAddress", "receptionAddress"].forEach(id => setText(id, config.address || "[Alamat lengkap]"));
  const map = config.mapUrl || "#";
  ["akadMap", "receptionMap"].forEach(id => { const el=$(id); if(el) el.href=map; });
  ["akadMap", "receptionMap"].forEach(id => { const el=$(id); if(el && map==="#") el.addEventListener("click", e=>{e.preventDefault();showToast("Tautan lokasi belum diatur.");}); });

  // Informasi rekening
  setText("bankName", config.bank?.name || "BANK BCA");
  setText("bankNumber", config.bank?.number || "1234567890");
  setText("bankHolder", `A/N ${config.bank?.holder || "Eva CR Sipayung"}`);

  // Google Calendar menggunakan tanggal utama/akad dari data sumber.
  const pad = n => String(n).padStart(2,"0");
  const calendarStamp = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const endDate = new Date(eventDate.getTime()+2*60*60*1000);
  const calendar = $("calendarLink");
  if(calendar) calendar.href=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Akad Pernikahan ${couple}`)}&dates=${calendarStamp(eventDate)}/${calendarStamp(endDate)}&details=${encodeURIComponent(`Akad pernikahan ${couple}. ${config.address||""}`)}&location=${encodeURIComponent(config.venue||"")}`;

  // Buka cover + musik
  const opening=$("opening"), music=$("backgroundMusic"), musicToggle=$("musicToggle");
  $("openInvitation")?.addEventListener("click", async()=>{
    opening?.classList.add("is-hidden"); document.body.classList.remove("locked");
    try { await music.play(); musicToggle?.classList.add("is-playing"); setText("musicToggle", "♫ Pause music"); }
    catch(_) { showToast("Undangan dibuka. Musik dapat diputar melalui tombol Music."); }
    setTimeout(()=>opening?.remove(),850);
  });
  musicToggle?.addEventListener("click",async()=>{
    if(music.paused){try{await music.play();musicToggle.classList.add("is-playing");musicToggle.querySelector(".music-label").textContent="Pause music";}catch(_){showToast("Tambahkan file MP3 pada assets/music/song.mp3.");}}
    else{music.pause();musicToggle.classList.remove("is-playing");musicToggle.querySelector(".music-label").textContent="Music";}
  });

  // Countdown
  function updateCountdown(){
    const distance=eventDate.getTime()-Date.now();
    if(distance<=0){setText("days","000");setText("hours","00");setText("minutes","00");setText("seconds","00");return;}
    setText("days",String(Math.floor(distance/86400000)).padStart(3,"0"));
    setText("hours",String(Math.floor(distance%86400000/3600000)).padStart(2,"0"));
    setText("minutes",String(Math.floor(distance%3600000/60000)).padStart(2,"0"));
    setText("seconds",String(Math.floor(distance%60000/1000)).padStart(2,"0"));
  }
  updateCountdown(); setInterval(updateCountdown,1000);

  // Gallery lightbox
  const lightbox=$("lightbox");
  document.querySelectorAll(".gallery-item").forEach(item=>item.addEventListener("click",()=>{
    const img=item.querySelector("img"); $("lightboxImage").src=img.currentSrc||img.src;
    lightbox.classList.add("is-open");lightbox.setAttribute("aria-hidden","false");
  }));
  function closeLightbox(){lightbox.classList.remove("is-open");lightbox.setAttribute("aria-hidden","true");}
  $("lightboxClose")?.addEventListener("click",closeLightbox);
  lightbox?.addEventListener("click",e=>{if(e.target===lightbox)closeLightbox();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeLightbox();});

  // Copy rekening
  $("copyAccount")?.addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(safeText(config.bank?.number||"1234567890"));showToast("Nomor rekening berhasil disalin.");}
    catch(_){showToast("Salin nomor rekening secara manual.");}
  });

  // RSVP: Google Sheets bila URL tersedia, selain itu WhatsApp bila nomor admin diisi.
  $("rsvpForm")?.addEventListener("submit",async e=>{
    e.preventDefault(); const form=e.currentTarget;
    const payload=Object.fromEntries(new FormData(form).entries()); const note=$("formNote");
    if(config.googleScriptUrl){
      const submit=form.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent="MENGIRIM...";
      try{await fetch(config.googleScriptUrl,{method:"POST",mode:"no-cors",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});note.textContent="Terima kasih. Konfirmasi Anda telah dikirim.";form.reset();}
      catch(_){note.textContent="Pengiriman gagal. Silakan coba kembali.";}
      finally{submit.disabled=false;submit.textContent="KIRIM KONFIRMASI ↗";}
      return;
    }
    const msg=`Halo, saya ${payload.name}. Konfirmasi kehadiran: ${payload.attendance}. Jumlah tamu: ${payload.guests}. Ucapan: ${payload.message||"-"}`;
    if(config.whatsappNumber){window.open(`https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(msg)}`,"_blank","noopener");note.textContent="Konfirmasi dibuka melalui WhatsApp.";}
    else{note.textContent="Formulir siap. Hubungkan Google Apps Script atau isi nomor WhatsApp admin pada js/config.js untuk menerima RSVP.";showToast("Tujuan pengiriman RSVP belum diatur.");}
  });

  // Reveal saat section masuk viewport
  const revealItems=document.querySelectorAll(".reveal");
  if("IntersectionObserver" in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target);}}),{threshold:.12});revealItems.forEach(item=>observer.observe(item));}
  else revealItems.forEach(item=>item.classList.add("visible"));

  function showToast(message){const toast=$("toast");if(!toast)return;toast.textContent=message;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2600);}
})();
