$(document).ready(function(){

    $('#savePasswordBtn').click(() => {
        let password = $('#password').val();
        let new_password = $('#new_password').val();
        let confirm_new_password = $('#confirm_new_password').val();
    
        // Reset semua error dan validasi
        $('.form-control').removeClass('is-invalid');
        $('.invalid-feedback').text('');
    
        if (!password || !new_password || !confirm_new_password) {
            if (!password) $('#password').addClass('is-invalid');
            if (!new_password) $('#new_password').addClass('is-invalid');
            if (!confirm_new_password) $('#confirm_new_password').addClass('is-invalid');
            return;
        }
    
        let payload = {
            password: password,
            new_password: new_password,
            confirm_new_password: confirm_new_password
        };
    
        $.ajax({
            url: "/api/change-password",
            type: "POST",
            data: JSON.stringify(payload),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                if (data.success !== true) {
                    if (data.field === 'password') {
                        $('#password').addClass('is-invalid');
                        $('#error_password').text(data.message);
                    }
                    if (data.field === 'confirm_new_password') {
                        $('#new_password').addClass('is-invalid');
                        $('#confirm_new_password').addClass('is-invalid');
                        $('#error_confirm').text(data.message);
                    }
                } else {
                    $('#changePasswordModal input').val('');
                    $('.form-control').removeClass('is-invalid');
                    $('.invalid-feedback').text('');
                    $('#changePasswordModal').modal('hide');
                    setTimeout(() => {
                        $('.modal-backdrop').remove();
                        $('body').removeClass('modal-open');
                    }, 500);
                }
            },
            error: function (xhr, status, error) {
                alert("Terjadi kesalahan server.");
            }
        });
    });

    $('#saveProfileBtn').click(() => {
        let name = $('#user_name').val();
        let email = $('#user_email').val();
        let phone = $('#user_phone').val();
        let password = $('#user_password').val();
    
        // Reset semua error dan validasi
        $('.form-control').removeClass('is-invalid');
        $('.invalid-feedback').text('');
    
        if (!name || !email || !phone || !password) {
            if (!name) $('#user_name').addClass('is-invalid');
            if (!email) $('#user_email').addClass('is-invalid');
            if (!phone) $('#user_phone').addClass('is-invalid');
            if (!password) $('#user_password').addClass('is-invalid');
            return;
        }
    
        let payload = {
            name: name,
            email: email,
            phone: phone,
            password: password
        };
    
        $.ajax({
            url: "/api/update-profile",
            type: "POST",
            data: JSON.stringify(payload),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                console.log(data);
                if (data.success !== true) {
                    if (data.field === 'password') {
                        $('#user_password').addClass('is-invalid');
                        $('#error_profile_password').text(data.message);
                    }
                } else {
                    location.reload();
                }
            },
            error: function (xhr, status, error) {
                console.log(status);
                console.log(error);
            }
        });
    });
})