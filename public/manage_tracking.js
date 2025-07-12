$(document).ready(function(){

    const dataRiwayat = [
        {
          id: 1,
          jalan: "Jl. Soekarno Hatta",
          metode: "otomatis",
          tanggal: "2025-06-16",
          dari: "Jl. A",
          ke: "Jl. B",
          jarak: "1.2 km",
          lubang: 5,
          status: "diterima"
        },
        {
          id: 2,
          jalan: "Jl. Gajah Mada",
          metode: "manual",
          tanggal: "2025-06-14",
          lokasi: "Jl. Gajah Mada No. 45",
          lubang: 1,
          status: "ditolak",
          alasan: "Gambar buram/tidak valid"
        },
        {
          id: 3,
          jalan: "Jl. Imam Bonjol",
          metode: "otomatis",
          tanggal: "2025-06-13",
          dari: "Jl. X",
          ke: "Jl. Y",
          jarak: "2.5 km",
          lubang: 7,
          status: "menunggu"
        },
        {
          id: 4,
          jalan: "Jl. Kartini",
          metode: "manual",
          tanggal: "2025-06-12",
          lokasi: "Depan Taman Kartini",
          lubang: 2,
          status: "menunggu"
        }
      ];
  
    const riwayatList = $("#riwayatList");
    const filterTanggal = $("#filterTanggal");
    const filterStatus = $("#filterStatus");
    const filterSearch = $("#searchInput");

    function renderRiwayat() {
        const status = filterStatus.val();
        const sort = filterTanggal.val();
        const search = filterSearch.val();

        riwayatList.html(
            `<li class='list-group-item d-flex justify-content-center align-items-center' style="height:200px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </li>`
        )
        $.ajax({
            url: "/api/get/tracking",
            type: "POST",
            data: JSON.stringify({
                status: status,
                sort: sort,
                search: search,
                detectionId: false,
            }),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                console.log(data);
                if (data.results.length === 0){
                    riwayatList.html(`<li class='list-group-item text-center text-muted'>Tidak ada data.</li>`)
                }else{
                    let renderedHtml = ``
                    data.results.forEach(record => {
                        renderedHtml += `
                        <a href="/tracking-history/${record.detections_id}" class="list-group-item list-group-item-action">
                            <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <span class="badge bg-secondary badge-label">${record.user_name}</span> - ${formatTanggal(record.created_at)}<br>`;

                        renderedHtml += `Dari: ${record.start_location} <br>Ke: ${record.end_location}<br>Jarak: ${record.distance} Km | Jumlah Lubang: ${record.hole_count}`;

                        if (record.status === "ditolak" && record.decline_reason) {
                            renderedHtml += `<br><span class="text-danger small">Ditolak - ${record.decline_reason}</span>`;
                        }

                        renderedHtml += `</div>
                            <span class="status-badge status-${record.status}">${capitalize(record.status)}</span>
                            </div>
                        </a>
                        `;
                    });
                    riwayatList.html(renderedHtml);
                }
            },
            error: function (xhr, status, error) {
                console.log(status);
                console.log(error);
            }
        });
    }

    function formatTanggal(tgl) {
        const opsi = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(tgl).toLocaleDateString("id-ID", opsi);
    }

    function capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    filterTanggal.on("change", ()=>{
        renderRiwayat();
    });
    filterStatus.on("change", ()=>{
        renderRiwayat();
    });

    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }
    const debouncedRender = debounce(() => {
        renderRiwayat();
    }, 300);
    
    filterSearch.on('keyup', debouncedRender);

    renderRiwayat();
})