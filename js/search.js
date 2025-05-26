// search.js

// Base URL for your API
const BASE = 'https://eq5e94vkxd.execute-api.us-east-1.amazonaws.com/Final';

document.addEventListener('DOMContentLoaded', () => {
  // ไลต์เมนู active
  document.querySelectorAll('nav.navbar a').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href').endsWith('search.html'));
  });

  // ผูกปุ่มค้นหา
  document.getElementById('search-btn').addEventListener('click', handleSearch);
});

async function handleSearch() {
  // อ่านค่าจากฟอร์ม
  const dateFrom = document.getElementById('date-from').value;
  const dateTo   = document.getElementById('date-to').value;
  const gender   = document.getElementById('gender-filter').value;
  const ageMin   = document.getElementById('age-min').value;
  const ageMax   = document.getElementById('age-max').value;
  const province = document.getElementById('province-filter').value;
  const name     = document.getElementById('name-filter').value.trim();
  

  // สร้าง query string
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo)   params.append('dateTo', dateTo);
  if (gender)   params.append('gender', gender);
  if (ageMin)   params.append('ageMin', ageMin);
  if (ageMax)   params.append('ageMax', ageMax);
  if (province) params.append('province', province);
  if (name)     params.append('full_name', name);

  const url = `${BASE}/search?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const cases = await response.json();

    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '';

    if (!Array.isArray(cases) || cases.length === 0) {
      resultsDiv.innerHTML = '<p>ไม่พบเคสที่ตรงกับคำค้น</p>';
      return;
    }

    cases.forEach(item => {
      const card = document.createElement('div');
      card.className = 'case-card';
      card.innerHTML = `
        <p><strong>รหัสเคส:</strong> ${item.case_id}</p>
        ${item.photo_url ? `<img src="${item.photo_url}" class="person-img" />` : ''}
        <h3>${item.full_name}</h3>
        <p>เพศ: ${item.gender} | อายุ: ${item.age}</p>
        <p><strong>วันที่หาย:</strong>
        ${new Date(item.last_seen_date) 
        .toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })} 
        </p>
        <p>จังหวัด: ${item.province}</p>
        <p><strong>รายละเอียดเพิ่มเติม:</strong> ${item.description || '-'}</p>
        <button class="btn-delete" data-id="${item.case_id}">ลบ</button>
      `;
      resultsDiv.appendChild(card);

      // ผูกปุ่มลบ ให้เรียก handleSearch() ใหม่หลังลบสำเร็จ
      card.querySelector('.btn-delete').addEventListener('click', async () => {
        if (!confirm('ยืนยันลบเคสนี้?')) return;
        try {
          const res = await fetch(
            `${BASE}/delete-Case/${item.case_id}`,
            { method: 'DELETE' }
          );
          const result = await res.json();
          if (res.ok && result.success) {
            alert('ลบเคสสำเร็จ');
            handleSearch();  // รีเฟรชผลลัพธ์การค้นหา
          } else {
            alert('ลบไม่สำเร็จ: ' + (result.message || res.status));
          }
        } catch (err) {
          console.error('Error deleting case:', err);
          alert('เกิดข้อผิดพลาดในการลบเคส');
        }
      });
    });
  } catch (err) {
    console.error('Error in handleSearch:', err);
    alert('เกิดข้อผิดพลาดในการค้นหา');
  }
}
