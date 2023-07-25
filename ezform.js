"use strict";

function postForm(ops)
{
   this.ops = {
       url: '',
       form: false,
       formData: {},
       headers: {},
       validators: {
           items: {},
           messages: {}
       },
       method: 'POST',
       notif: true,
       notif_hide_time: 3,
       onsuccess: function(){},
       onerror: function(){},
   };

   this.data = function(){
       let _this = this;

       let csrfToken = document.querySelector('meta[name="csrf-token"]') ? document.querySelector('meta[name="csrf-token"]').content : '';
       csrfToken = this.ops.form.querySelector('_token') ? this.ops.form.querySelector('_token').value : csrfToken;

       this.ops.headers['X-CSRF-TOKEN'] = csrfToken;

       let formData = {};

       Object.keys(this.ops.formData).forEach(item=>{
           formData[item] = _this.ops.formData[item].value;
       });

       return {
           url: this.ops.url, 
           form: this.ops.form,
           formData: formData,
           isLoading: false,
           notifbox: document.querySelector('#ppf-notif'),
           notif_hide_time: this.ops.notif_hide_time,
           headers: this.ops.headers,
           method: this.ops.method
       }
   };

   this.validate = function(data,message)
   {
       if( !data ) return { success: false, message: 'Data is empty', errors: ['data is empty'] };

       let _this = this;

       let validator = [
           {
               name: 'required',
               action: function(val){
                   return val != '' ? true : false
               },
               message: '{name} is required'
           },
           {
               name: 'email',
               action: function(val){
                   var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                   return re.test(val);
               },
               message: '{name} must be a valid email'
           },
           {
               name: 'number',
               action: function(val){
                   return /^[0-9]+$/.test(val);
               },
               message: '{name} must contains only numbers'
           },
           {
               name: 'string',
               action: function(val){
                   return /^[a-zA-Z]*$/g.test(val);
               },
               message: '{name} must be string'
           }
       ];

       let errors = [];
       
       Object.keys(data).forEach(item=>{
           let items = data[item].split('|');
           let formData = _this.data().formData;
           let new_items = [];
           
           items.forEach(i=>{
               let validate  = validator.find( e => e.name == i );
           
               if( validate && !validate.action(formData[item]) ){
                   if( message[item+'.'+i] ){
                       new_items.push(message[item+'.'+i].replaceAll('{name}',item.replaceAll('_',' ').toLowerCase()));
                   }else{
                       new_items.push(validate.message.replaceAll('{name}',item.replaceAll('_',' ').toLowerCase()));
                   }
               }
           });

           if( new_items.length > 0 ){
               errors = errors.concat(new_items);
           }
       });

       return errors;
   };
   
   this.events = function()
   {
       let _this = this;

       this.data().form.addEventListener('submit',function(){
           event.preventDefault();

           let validate = _this.validate(_this.ops.validators.items,_this.ops.validators.messages);

           if( validate.length > 0 ){
               if( _this.ops.notif ){
                   _this.notif('error',validate.join(', '));
               }
   
               _this.ops.onerror(validate);
           }else{

               let formData = new FormData();
               let data = _this.data();
               let items = data.formData;

               Object.keys(items).forEach(item=>{
                   let item_data = items[item];

                   if( _this.ops.formData[item].getAttribute('type') == 'file' && _this.ops.formData[item].files.length > 0 ){
                       item_data = _this.ops.formData[item].files[0];
                   }
                   
                   formData.append(item,item_data);
               });

               fetch(data.url,{
                   method: data.method,
                   body: formData,
                   headers: data.headers
               })
               .then( res => res.json() )
               .then( res =>{
                   if( res.hasOwnProperty('success') && !res.success ){
                       let message = res.message;

                       if( res.hasOwnProperty('errors') ){
                           message = res.errors.join(',');
                       }

                       if( _this.ops.notif ) _this.notif('error',message);
                   
                       _this.ops.onerror(res);
                   }else{
                       if( _this.ops.notif ) _this.notif('success',res.message);
               
                       _this.ops.onsuccess(res);
                   }
                   _this.hideNotif();
               })
               .catch(err=>{
                   let errors = [];
                   let message = '';

                   if( err.hasOwnProperty('errors') ){
                       Object.keys(err.errors).forEach(item=>{
                           errors.push(err.errors[item]);
                       });

                       message = errors.join(', ');
                   }else{
                       message = err.message;
                   }

                   if( _this.ops.notif ) _this.notif('error',message);

                   _this.ops.onerror(err);
                   _this.hideNotif();
               });
           }
       });
   };

   this.hideNotif = function(){
       let _this = this;
       let timeout = this.data().notif_hide_time * 1000;

       setTimeout(function(){
           _this.notif('','','hide');
       },timeout);
   }

   this.notif = function(icon,message,action)
   {
       let _this = this;

       if( !this.data().notifbox ){
           let el = document.createElement('div');
           el.setAttribute('id','ppf-notif');
           el.onclick = function(){
               _this.notif('','','hide');
           }
           el.classList.add('ppf-notif');
           el.setAttribute('style','position:fixed;z-index:9999;display:none;font-size:16px;background:#fff;min-width:300px;max-width:90%;z-index:9999;box-shadow:0 1px 6px 0 rgba(0,0,0,.12),0 1px 6px 0 rgba(0,0,0,.12);bottom:20px;right:20px');
           el.innerHTML = '<div class="ppf-notif-content" style="padding:16px;height:100%;width:100%;display:flex;align-items:center"><div class="ppf-notif-icon" style="width:32px;height:32px;margin-right:8px"></div><span class="ppf-notif-message"></span></div>'
           document.querySelector('body').appendChild(el);
       }

       let data = this.data();

       if( icon == 'success' ){
           data.notifbox.querySelector('.ppf-notif-icon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-check" viewBox="0 0 24 24" stroke-width="1.5" stroke="#42ba96" fill="none" stroke-linecap="round" stroke-linejoin="round"><path fill="none" d="M0 0h24v24H0z" stroke="none"></path><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"></path><path d="M9 12l2 2l4 -4"></path></svg>';
       }else if(icon == 'error' ){
           data.notifbox.querySelector('.ppf-notif-icon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-exclamation-circle" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ff3333" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 9v4"/><path d="M12 16v.01"/></svg>';
       }

       if( message ){
           data.notifbox.querySelector('.ppf-notif-message').textContent = message;
       }

       if( !action || action == 'show' ){
           data.notifbox.classList.add('show');
           data.notifbox.style.display = 'block';
       }else if( action == 'hide' ){
           data.notifbox.classList.add('hide');
           data.notifbox.style.display = 'none';
       }
   };

   this.init = function()
   {
       let _this = this;

       if( !ops ){
           console.log('wfa form plugin: no options provided, init failed');
           return;
       }else if( !ops.hasOwnProperty('form')){
           console.log('wfa form plugin: no form provided, init failed');
           return;
       }else if( !ops.hasOwnProperty('url') ){
           console.log('wfa form plugin: no form url provided, init failed');
           return;
       }

       this.ops.form = document.querySelector(ops.form);
       this.ops.url = ops.url;

       if( !this.ops.form ){
           console.log('wfa form plugin: form not found, init failed');
           return;
       }

       if( ops.hasOwnProperty('formData') ){
           ops.formData.forEach(item=>{
               _this.ops.formData[item.name] = _this.ops.form.querySelector('[name="'+item.name+'"]');

               if( item.validate ){
                   _this.ops.validators.items[item.name] = item.validate;
               }

               if( item.validate_message ){
                   Object.keys(item.validate_message).forEach(validator_item=>{
                       _this.ops.validators.messages[item.name+'.'+validator_item] = item.validate_message[validator_item];
                   });
               }
           });
       }

       if( ops.hasOwnProperty('headers') ){
           let headers = this.ops.headers;
           this.ops.headers = {headers,...ops.headers};
       }

       if( ops.hasOwnProperty('method') ){
           this.ops.method = ops.method;
       }

       if( ops.hasOwnProperty('notif') ){
           this.ops.notif = ops.notif;
       }

       if( ops.hasOwnProperty('onsuccess') ){
           this.ops.onsuccess = ops.onsuccess;
       }

       if( ops.hasOwnProperty('onerror') ){
           this.ops.onerror = ops.onerror;
       }

       if( ops.hasOwnProperty('notif_hide_time') ){
           this.ops.notif_hide_time = ops.notif_hide_time;
       }

       this.events();
   };

   this.init();
}
