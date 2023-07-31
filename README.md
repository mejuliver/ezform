## TO USE
insert inside html body `<script src="path/to/ezform.js">`
<br>
init class
```
new postForm({
    url: 'backend url', // form url
    form: '#myform',
    formData: [ // form inputs
        {
            name: 'input name e.g. name from <input type="email" name="email">',
            validate: 'optional, e.g. required|email', // validations: required, string, email, number
            validate_message: { // optional, default: validator message
                required: 'input is required',
                email: 'input must be a valid email'
            }
        }
    ],
    headers: { // optional, value: http headers
        'Accept': 'application/json'
    },
    method: 'optional, default: POST, value: GET/POST/GET/PATCH/DELETE',
    notif: true, // optional, default: true, value: true/false,
    notif_hide_time: 3, // optional, default: 3 seconds, value: number of seconds before the notification will exit
    beforeSubmit: function(){
        // if return false then form event will be cancelled
        // optional, default: true, value: true/false
    },
    onSuccess: function(){
        // optional, default: none, value: custom function that will be triggered after a success form submission
    },
    onError: function(){
        // optional, default: none, value: custom function that will be triggered after a error form submission
    }
});
```
<br> 

you can reset form values by calling `form.reset()` where form is your form instance e.g. `var form = new postForm({...})` 
<br> 
you can create many ezform instance as you needed
