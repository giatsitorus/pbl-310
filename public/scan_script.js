// $(document).ready(function(){
//     const video = document.getElementById('video');
//     const canvas = document.getElementById('canvas');
//     const ctx = canvas.getContext('2d');
//     let stream;
//     let animationId;
//     let intervalId;
//     let watchId;
//     let pathCoordinates = [];

//     const trackedObjects = {}; // track_id: { bbox, class, lastSeen }
//     const loggedTrackIds = new Set();
//     const TTL = 3000; // 3 detik, bisa diubah sesuai kebutuhan

//     function captureAndSend() {
//         if (!video.videoWidth || !video.videoHeight) return;

//         const hiddenCanvas = document.createElement('canvas');
//         hiddenCanvas.width = video.videoWidth;
//         hiddenCanvas.height = video.videoHeight;
//         const hiddenCtx = hiddenCanvas.getContext('2d');
//         hiddenCtx.drawImage(video, 0, 0, hiddenCanvas.width, hiddenCanvas.height);

//         const imageData = hiddenCanvas.toDataURL('image/jpeg');

//         fetch('https://192.168.1.15:5000/detect', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ image: imageData })
//         })
//         .then(res => res.json())
//         .then(data => {
//             const now = Date.now();
//             data.forEach(det => {
//                 const id = det.track_id !== undefined ? det.track_id : `${det.class}-${det.bbox.join('-')}`;

//                 trackedObjects[id] = {
//                     bbox: det.bbox,
//                     class: det.class,
//                     lastSeen: now
//                 };

//                 // Optional: simpan track_id untuk log
//                 if (!loggedTrackIds.has(id)) {
//                     loggedTrackIds.add(id);
//                     console.log("Logged (once):", id);
//                     // kamu bisa simpan ke database / report di sini
//                 }
//             });
//         })
//         .catch(err => console.error('Detection error:', err));
//     }


//     function drawDetections() {
//         if (!video.videoWidth || !video.videoHeight) {
//             animationId = requestAnimationFrame(drawDetections);
//             return;
//         }
    
//         if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
//             canvas.width = video.videoWidth;
//             canvas.height = video.videoHeight;
//         }
    
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
//         const now = Date.now();
    
//         Object.entries(trackedObjects).forEach(([id, obj]) => {
//             if (now - obj.lastSeen > TTL) {
//                 delete trackedObjects[id];
//                 return;
//             }
    
//             const [x1, y1, x2, y2] = obj.bbox;
//             ctx.strokeStyle = "lime";
//             ctx.lineWidth = 2;
//             ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
//             ctx.fillStyle = "lime";
//             ctx.font = "9px Arial";
//             ctx.fillText(`${obj.class}`, x1, y1 - 6);
//         });
    
//         animationId = requestAnimationFrame(drawDetections);
//     }

//     $('#startScanning').click(() => {
//         if ("geolocation" in navigator) {
//             navigator.geolocation.getCurrentPosition(
//                 async (position) => {
//                     const lat = position.coords.latitude;
//                     const lon = position.coords.longitude;
//                     if (!lat || !lon) console.log("error here");

//                     try {
//                         const response = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
//                         const data = await response.json();
//                         let display_name = `${data.display_name}`;
//                         $('#startLocation').text(display_name);
//                     } catch (error) {
//                         console.error('Error:', error);
//                     }

//                     watchId = navigator.geolocation.watchPosition(
//                         (position) => {
//                             const lat = position.coords.latitude;
//                             const lon = position.coords.longitude;
//                             pathCoordinates.push({ lat, lon });
//                             console.log("Tracked:", lat, lon);
//                         },
//                         (error) => {
//                             console.error("Tracking error:", error);
//                         },
//                         {
//                             enableHighAccuracy: true,
//                             maximumAge: 1000,
//                             timeout: 5000
//                         }
//                     );
//                 }
//             );
//         } else {
//             console.log("Geolocation tidak didukung oleh browser ini.");
//         }

//         navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
//             .then(s => {
//                 stream = s;
//                 video.srcObject = stream;
//                 video.onloadedmetadata = () => {
//                     canvas.width = video.videoWidth;
//                     canvas.height = video.videoHeight;

//                     intervalId = setInterval(captureAndSend, 500);
//                     animationId = requestAnimationFrame(drawDetections);
//                 };
//             });
//     });

//     $('#endScanning').click(() => {
//         if (watchId !== undefined) {
//             navigator.geolocation.clearWatch(watchId);
//             console.log("Tracking stopped.");
//             console.log("Path coordinates:", pathCoordinates);
//         }
//         if (stream) {
//             stream.getTracks().forEach(track => track.stop());
//             video.srcObject = null;
//         }

//         if (intervalId) {
//             clearInterval(intervalId);
//             intervalId = null;
//         }

//         if (animationId) {
//             cancelAnimationFrame(animationId);
//             animationId = null;
//         }

//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//         Object.keys(trackedObjects).forEach(id => delete trackedObjects[id]);
//     });
// });

$(document).ready(function(){

    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let detections = [];
    let stream;
    let animationId;
    let intervalId;
    let watchId;
    let pathCoordinates = [];
    let list_images = [];
    const trackedObjects = {};

    function captureAndSend() {
        const count = Object.keys(trackedObjects).length;
        $('#holeDetected').text(count);
        const totalDistance = calculateTotalDistance(pathCoordinates);
        $('#distance').text((totalDistance / 1000).toFixed(2) + " km");

        const hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.width = video.videoWidth;
        hiddenCanvas.height = video.videoHeight;
        const hiddenCtx = hiddenCanvas.getContext('2d');
        hiddenCtx.drawImage(video, 0, 0);

        const imageData = hiddenCanvas.toDataURL('image/jpeg');

        fetch('http://127.0.0.1:5000/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
        })
        .then(res => res.json())
        .then(data => {
            if (data.image){
                list_images.push(data.image);
            }
            detections = data.detections;
            detections.forEach(det => {
                const id = det.track_id !== undefined ? det.track_id : `${det.class}-${det.bbox.join('-')}`;

                trackedObjects[id] = {
                    bbox: det.bbox,
                    class: det.class,
                };
            });
        })
        .catch(err => console.error('Detection error:', err));
    }

    function drawDetections() {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        detections.forEach(d => {
            const [x1, y1, x2, y2] = d.bbox;
            ctx.strokeStyle = "lime";
            ctx.lineWidth = 2;
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            ctx.fillStyle = "lime";
            ctx.font = "9px Arial";
            ctx.fillText(d.class, x1, y1 - 4);
        });
        requestAnimationFrame(drawDetections);
    }

    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; 
        const toRad = angle => angle * Math.PI / 180;
    
        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const Δφ = toRad(lat2 - lat1);
        const Δλ = toRad(lon2 - lon1);
    
        const a = Math.sin(Δφ / 2) ** 2 +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) ** 2;
    
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
        const distance = R * c;
        return distance;
    }

    function calculateTotalDistance(path) {
        let total = 0;
        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            total += haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);
        }
        return total;
    }

    $('#startScanning').click(()=>{
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    if (!lat || !lon) console.log("error here");
                
                    try {
                        const response = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
                        const data = await response.json();
                        // let display_name = ${data.address.amenity}, ${data.address.road}, ${data.address.village}
                        let display_name = `${data.display_name}`;
                        $('#startLocation').text(display_name)
                      } catch (error) {
                        console.error('Error:', error);
                      }
                    watchId = navigator.geolocation.watchPosition(
                        (position) => {
                          const lat = position.coords.latitude;
                          const lon = position.coords.longitude;
                          pathCoordinates.push({ lat, lon });
                          console.log("Tracked:", lat, lon);
                        },
                        (error) => {
                          console.error("Tracking error:", error);
                        },
                        {
                          enableHighAccuracy: true,
                          maximumAge: 1000,
                          timeout: 5000
                        }
                    );
                }
            );
        } else {
        console.log("Geolocation tidak didukung oleh browser ini.");
        }
        // navigator.mediaDevices.enumerateDevices()
        // .then(devices => {
        //     const videoDevices = devices.filter(device => device.kind === 'videoinput');
        //     console.log("Kamera yang tersedia:", videoDevices);

        //     // Pilih kamera eksternal (biasanya bukan yang pertama)
        //     const externalCamera = videoDevices.find(device => !device.label.toLowerCase().includes("integrated"));
        //     const deviceIdToUse = externalCamera ? externalCamera.deviceId : videoDevices[0]?.deviceId;

        //     if (!deviceIdToUse) {
        //     throw new Error("Tidak ada kamera ditemukan");
        //     }

        //     return navigator.mediaDevices.getUserMedia({
        //     video: { deviceId: { exact: deviceIdToUse } }
        //     });
        // })
        // .then(s => {
        //     // video.srcObject = stream;
        //     // video.play();
        //     stream = s;
        //     video.srcObject = stream;
        //     video.onloadedmetadata = () => {
        //       canvas.width = video.videoWidth;
        //       canvas.height = video.videoHeight;
        //       intervalId = setInterval(captureAndSend, 500);
        //       animationId = requestAnimationFrame(drawDetections);
        //     };
        // })
        // .catch(err => console.error("Gagal membuka kamera:", err));
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        // navigator.mediaDevices.getUserMedia({ video: true })
          .then(s => {
            stream = s;
            video.srcObject = stream;
            video.onloadedmetadata = () => {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              intervalId = setInterval(captureAndSend, 500);
              animationId = requestAnimationFrame(drawDetections);
            };
          });
    });

    $('#endScanning').click(() => {
        if (watchId !== undefined) {
            navigator.geolocation.clearWatch(watchId);
            watchId = undefined;
        }
    
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            stream = null;
        }
    
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    
        detections = [];
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    $("#confirmSubmit").click(async ()=>{
        console.log(pathCoordinates)
        let startCoordinates = pathCoordinates[0]
        const startResponse = await fetch(`/api/reverse-geocode?lat=${startCoordinates.lat}&lon=${startCoordinates.lon}`);
        const startData = await startResponse.json();

        let endCoordinates = pathCoordinates[0]
        const endResponse = await fetch(`/api/reverse-geocode?lat=${endCoordinates.lat}&lon=${endCoordinates.lon}`);
        const endData = await endResponse.json();

        let payload = {
            start_location: startData.display_name,
            end_location: endData.display_name,
            distance: (calculateTotalDistance(pathCoordinates) / 1000).toFixed(2),
            hole_count: Object.keys(trackedObjects).length,
            coordinates: pathCoordinates,
            list_images: list_images
        };
        $.ajax({
            url: "/api/add-detection",
            type: "POST",
            data: JSON.stringify(payload),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                $('#confirmModal').modal('hide');
                setTimeout(() => {
                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open');
                }, 500);
                for (const id in trackedObjects) {
                    delete trackedObjects[id];
                }
                pathCoordinates = [];
                list_images = [];
                $('#holeDetected').text('');
                $('#distance').text('');
                $('#startLocation').text('')
            },
            error: function (xhr, status, error) {
                console.error("Terjadi kesalahan server.");
            }
        });
    })
})

