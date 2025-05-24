document.getElementById('filterForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const gender = document.getElementById('gender').value.trim();
  const ageRange = document.getElementById('ageRange').value;
  const dateFrom = document.getElementById('dateFrom').value;
  const dateTo = document.getElementById('dateTo').value;
  const province = document.getElementById('province').value.trim();

  const rows = document.querySelectorAll('#missingTable tbody tr');

  rows.forEach(row => {
    const rowGender = row.cells[2].textContent.trim();
    const rowAgeText = row.cells[3].textContent.trim();
    const rowProvince = row.cells[4].textContent.trim();
    const rowDate = row.cells[5].textContent.trim();

    let show = true;

    // กรองเพศ
    if (gender && rowGender !== gender) {
      show = false;
    }

    // กรองช่วงอายุ
    if (ageRange) {
      const age = parseInt(rowAgeText);
      switch(ageRange) {
        case "lt5":
          if (isNaN(age) || age >= 5) show = false;
          break;
        case "5to24":
          if (isNaN(age) || age < 5 || age > 24) show = false;
          break;
        case "25to44":
          if (isNaN(age) || age < 25 || age > 44) show = false;
          break;
        case "45to64":
          if (isNaN(age) || age < 45 || age > 64) show = false;
          break;
        case "65plus":
          if (isNaN(age) || age < 65) show = false;
          break;
        case "unknown":
          if (!isNaN(age)) show = false;  // แสดงเฉพาะที่อายุไม่ใช่ตัวเลข (ไม่ระบุ)
          break;
      }
    }

    // กรองจังหวัด
    if (province && rowProvince !== province) {
      show = false;
    }

    // กรองวันที่แจ้งหาย (ช่วง)
    if (dateFrom && rowDate < dateFrom) {
      show = false;
    }
    if (dateTo && rowDate > dateTo) {
      show = false;
    }

    row.style.display = show ? '' : 'none';
  });
});
