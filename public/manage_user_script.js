$(document).ready(function(){

    $('#addUserBtn').click(()=>{
        let name = $('#user_name').val();
        let email = $('#user_email').val();
        let phone = $('#user_phone').val();
        let password = $('#user_password').val();
        let status = $('#user_status').val();
        let role = $('#user_role').val();
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
            password: password,
            role: role,
            status: status
        };

        $.ajax({
            url: "/api/add-user",
            type: "POST",
            data: JSON.stringify(payload),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                location.reload();
            },
            error: function (xhr, status, error) {
                console.log(status);
                console.log(error);
            }
        });

    });

    $('.updateStatus').on('change', function() {
        let $el = $(this);
        let selectedValue = $el.val();
        let userId = $el.data('user_id');  

        let payload = {
            status: selectedValue,
            user_id: userId
        }

        
        $.ajax({
            url: "/api/update-status",
            type: "POST",
            data: JSON.stringify(payload),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                const toast = new bootstrap.Toast(document.getElementById('statusToast'));
                toast.show();
            },
            error: function (xhr, status, error) {
                console.log(status);
                console.log(error);
            }
        });

    });

    $('.updateRole').on('change', function() {
        let $el = $(this);
        let selectedValue = $el.val();
        let userId = $el.data('user_id');  

        let payload = {
            role: selectedValue,
            user_id: userId
        }

        
        $.ajax({
            url: "/api/update-role",
            type: "POST",
            data: JSON.stringify(payload),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                const toast = new bootstrap.Toast(document.getElementById('statusToast'));
                toast.show();
            },
            error: function (xhr, status, error) {
                console.log(status);
                console.log(error);
            }
        });

    });
    
})