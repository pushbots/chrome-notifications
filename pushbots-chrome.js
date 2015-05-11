	//Service worker file name
	var serviceWorkerFile = '/service-worker.js',
		logging = true,
		application_id = "PUSHBOTS_APP_ID",
		pushbots_url = "http://api.pushbots.com/";
	
	// Once the service worker is registered set the initial state  
	function initialise() { 
		
		var push_supported = (!!('PushManager' in window) || !!navigator.push) 
		&& !!window.Notification
		&& !!navigator.serviceWorker
		&& !!('showNotification' in ServiceWorkerRegistration.prototype);
		
		//Check if Push messaging && serviceWorker && Notifications are supported in the browser
		if(push_supported){
			
			var notificationStatusSetBefore = Notification.permission != "default";
				
			if(logging) console.log("Notification permission status:", Notification.permission);
			
			Notification.requestPermission(function(result) {
				if (result === 'denied') {
					if(logging) console.log('Permission was denied.');
					return;
				}else if( result === 'granted'){
				  
					//Register Notifications serviceWorker
					navigator.serviceWorker.register(serviceWorkerFile).then(function(serviceWorkerRegistration) {
						
						if(logging) console.log('Yey!', serviceWorkerRegistration);
						
						if (notificationStatusSetBefore) {
							serviceWorkerRegistration.pushManager.subscribe().then(function(subscription) {  
								// The subscription was successful 
								if(logging) console.log(subscription);
					  
								var token = subscription.subscriptionId;
					  		  	
								//Register the token on Pushbots
								try {
								    var xmlhttp = new XMLHttpRequest();
									var jsonBody = JSON.stringify({
										"token":token,
										"platform":2,
										"tz": Intl.DateTimeFormat().resolved.timeZone,
										"locale" : window.navigator.language || 'en'
									});
									
								    xmlhttp.open('PUT', pushbots_url  + 'deviceToken');
	
								    xmlhttp.setRequestHeader('X-pushbots-appid', application_id);
								    xmlhttp.setRequestHeader('content-type', 'application/json; charset=UTF-8');

									xmlhttp.onload = function(){
										if(this.status === 200){
											console.log("Updated info on Pushbots successfully.");
										}else if(this.status === 201){
											console.log("Registered on Pushbots successfully.");
										}else{
											console.warn("Status code" + this.status + ": error.")
										}
									};
									
									xmlhttp.onerror = function(e){
										console.log("Error occured: ", e);
									};
		
								    xmlhttp.send(jsonBody);
		
								} catch(e) {
									console.log('Cannot register on Pushbots: ' + e);
								}
								
								
								
							}).catch(function(e) {  
								if (Notification.permission === 'denied') {  
									// The user denied the notification permission which  
									// means we failed to subscribe and the user will need  
									// to manually change the notification permission to  
									// subscribe to push messages  
									if(logging) console.warn('Permission for Notifications was denied');  
								} else {  
									// A problem occurred with the subscription; common reasons  
									// include network errors, and lacking gcm_sender_id and/or  
									// gcm_user_visible_only in the manifest.  
									if(logging) console.error('Unable to subscribe to push.', e);
								}  
							});
						}else{
							//Refresh the page to enable serviceWorker for the first time
							setTimeout(function() {
								window.location.href = window.location.href;
							}, 200);
						}
					  
					}).catch(function(err) {
						if(logging) console.log('Boo!', err);
					});
				  
				}
			});
		}else{
			console.warn("Push messaging is not supported in this browser.");
		}
	}
	
	//Initialize Notifications
	if ( document.readyState === "complete" ) {
		initialise();
	}else{
		// Mozilla, Opera and webkit nightlies currently support this event
		if ( document.addEventListener ) {
			window.addEventListener( "load", initialise, false );
			// If IE event model is used
		} else if ( document.attachEvent ) {
			// ensure firing before onload,
			// maybe late but safe also for iframes
			document.attachEvent("onreadystatechange", function(){
				if ( document.readyState === "complete" ) {
					initialise();
				}
			});
		
		}
	}
