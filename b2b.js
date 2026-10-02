/* VeriPusula – B2B sipariş / tedarik formu (fiyat hesabı + /api/siparis, sunucu yoksa mailto) */
document.addEventListener('DOMContentLoaded', () => {
  const f = document.getElementById('siparisForm'); if (!f) return;
  const $ = (id) => document.getElementById(id);
  const TEDARIK = [
    ['G01', 'Enerji Modülü – EnerjiNova A.Ş.'], ['G02', 'İşlemci Modülü – MikroCore Teknoloji A.Ş.'],
    ['G03', 'Sensör Kiti – SensoTek A.Ş.'], ['G04', 'Kasa ve Ambalaj – FormAmbalaj A.Ş.'],
    ['G05', 'Yazılım Lisansı – BulutOS Yazılım A.Ş.'], ['G06', 'Lojistik Tokenı – HızlıRota Lojistik A.Ş.'],
    ['G08', 'Garanti Hizmet Paketi – GüvencePlus Hizmetleri A.Ş.']
  ];
  const kademe = (m) => m >= 1000 ? 100 : m >= 500 ? 120 : m >= 100 ? 135 : 150;   // fiyat listesiyle aynı
  const yuvarla = (n) => Math.round(n * 100) / 100;
  const tl = (n) => Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';

  function kalemDoldur() {
    const sip = $('sTur').value === 'siparis';
    $('sKalem').innerHTML = sip
      ? '<option value="G07">G07 – Müşteri Analitiği Lisansı</option>'
      : TEDARIK.map(([k, a]) => `<option value="${k}">${k} – ${a}</option>`).join('');
    $('sFiyatEtiket').textContent = sip ? 'Sipariş birim fiyatı (TL)' : 'Teklif birim fiyatı (TL)';
    $('sFiyat').placeholder = sip ? 'İstediğiniz birim fiyat' : 'Teklif ettiğiniz birim fiyat';
    hesapla();
  }

  function hesapla() {
    const sip = $('sTur').value === 'siparis';
    const m = parseInt($('sMiktar').value, 10);
    const b = parseFloat($('sFiyat').value);
    if (!(m > 0)) { $('sOzet').textContent = 'Geçerli bir miktar girin.'; return; }
    const ref = sip ? ` · Liste fiyatı (referans): ${tl(kademe(m))}` : '';
    $('sOzet').textContent = b > 0
      ? `${sip ? 'Sipariş' : 'Teklif'} toplamı: ${m.toLocaleString('tr-TR')} adet × ${tl(b)} = ${tl(yuvarla(b * m))}${ref}`
      : `Birim fiyatı kendiniz girin.${ref}`;
  }

  ['sTur'].forEach(i => $(i).addEventListener('change', kalemDoldur));
  ['sMiktar', 'sOdeme', 'sFiyat'].forEach(i => { $(i).addEventListener('input', hesapla); $(i).addEventListener('change', hesapla); });

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const m = $('sMsg');
    const d = {
      tur: $('sTur').value, kalem: $('sKalem').value, firma: $('sFirma').value.trim(), yetkili: $('sYetkili').value.trim(),
      eposta: $('sEposta').value.trim(), miktar: parseInt($('sMiktar').value, 10), odeme: $('sOdeme').value,
      birim_fiyat: parseFloat($('sFiyat').value), notu: $('sNot').value.trim()
    };
    if (!d.firma || !d.yetkili || !/^\S+@\S+\.\S+$/.test(d.eposta) || !(d.miktar > 0) || !(d.birim_fiyat > 0 && d.birim_fiyat <= 10000)) {
      m.className = 'msg err'; m.textContent = 'Lütfen tüm zorunlu alanları (ve birim fiyatı) doğru doldurun.'; return;
    }
    try {
      const r = await fetch('/api/siparis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
      if (!r.ok) throw new Error();
      m.className = 'msg ok'; m.textContent = 'Talebiniz alındı, teşekkürler! En kısa sürede dönüş yapılacaktır.';
      f.reset(); kalemDoldur();
    } catch (err) {
      const konu = `B2B ${d.tur === 'siparis' ? 'sipariş' : 'tedarik teklifi'} – ${d.firma}`;
      const govde = `${$('sTur').selectedOptions[0].text}\nKalem: ${$('sKalem').selectedOptions[0].text}\nMiktar: ${d.miktar}\nBirim fiyat: ${tl(d.birim_fiyat)}\nÖdeme: ${$('sOdeme').selectedOptions[0].text}\nYetkili: ${d.yetkili}\nE-posta: ${d.eposta}\nNot: ${d.notu || '-'}`;
      location.href = `mailto:info@veripusula.example?subject=${encodeURIComponent(konu)}&body=${encodeURIComponent(govde)}`;
      m.className = 'msg ok'; m.textContent = 'E-posta uygulamanız açılıyor…';
    }
  });

  kalemDoldur();
});
