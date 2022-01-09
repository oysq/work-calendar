Vue.use(vant.Popup);
Vue.use(vant.Field);
Vue.use(vant.Cell);
Vue.use(vant.CellGroup);
Vue.use(vant.Grid);
Vue.use(vant.GridItem);
Vue.use(vant.Divider);


Vue.prototype.$axios = axios
// Vue.prototype.$axios.defaults.baseURL = 'http://81.71.39.253:80/calendar-ms'
Vue.prototype.$axios.defaults.baseURL = 'http://127.0.0.1:80/calendar-ms'

// 吐司
Vue.prototype.$toast = vant.Toast
Vue.prototype.$toast.setDefaultOptions({ duration: 2000 });

// 顶部弹窗
Vue.prototype.$notify = vant.Notify

// 交互弹窗
Vue.prototype.$dialog = vant.Dialog

new Vue({
	el: '#app',
	data() {
		return {
			// 遮罩
			lodingStatus: false,
			// 登录弹窗
			showAuthPopup: false,
			// 用户信息
			userName: "",
			userPassword: "",
			authToken: "",
			// 打卡弹窗
			showPunchPopup: false,
			punchTimeSelect: "",
			punchTimeResult: ""
		}
	},
	created() {
		this.checkToken();
	},
	methods: {
		/**
		 * 用户认证相关
		 */
		checkToken() {
			this.showLoding();
			this.authToken = window.localStorage.getItem('authToken')
			if (!this.authToken) {
				this.hideLoding();
				this.$toast.fail("需要登录一下哦");
				this.showAuthPopup = true
				return
			}
			this.$axios.post('/user/checkToken', 
					{
						token: this.authToken
					}
				).then(res => {
					this.hideLoding();
			    	if(res.data.status == 1) {
				   	    this.$notify({ type: 'success', message: "身份验证通过，欢迎 " + res.data.body.name});
					} else {
						this.$toast.fail("有点久了哦，重新登录一下昂");
				        this.showAuthPopup = true
					    return
					}
				}).catch(function (error) {
					this.hideLoding();
					console.log(error);
				    alert(error);
				});
		},
		// 获取token
		getToken() {
			this.showLoding();
			this.$axios.post('/user/checkUserExists',
					{
						userName: this.userName
					}
				).then(res => {
					this.hideLoding();
			    	if(res.data.status == 1) {

				   	    // 用户已存在
				   	    if(res.data.body.type === "exists") {

				   	    	// 刷新token
				   	    	this.refreshToken();

				   	    } else if(res.data.body.type === "no_exists") {

				   	    	// 用户不存在
				   	    	this.$dialog.confirm({
							  title: '不存在提醒',
							  message: '该账号为首次出现，是否作为新账号创建？',
							  cancelButtonText: '重新输入'
							})
							.then(() => {
						    	// on confirm
						    	// 创建用户
					   	    	this.$axios.post('/user/insertUser',
									{
										userName: this.userName,
										password: this.userPassword
									}
								).then(res => {
									if(res.data.status == 1) {

										// 刷新token
				   	    				this.refreshToken();

									} else {
										this.$toast.fail(res.data.msg);
									}
								}).catch(function (error) {
									this.hideLoding();
									console.log(error);
								    alert(error);
								});

							})
							.catch(() => {
						    	// on cancel：do nothing
							});

				   	    } else {
				   	    	this.$toast.fail("用户查询异常");
				   	    }
					} else {
						this.$toast.fail(res.data.msg);
					}
				}).catch(function (error) {
					this.hideLoding();
					console.log(error);
				    alert(error);
				});
		},
		// 刷新token
		refreshToken() {
			this.$axios.post('/user/refreshToken',
				{
					userName: this.userName,
					password: this.userPassword
				}
			).then(res => {
				if(res.data.status == 1) {
					window.localStorage.setItem("authToken", res.data.body.token);
					this.showAuthPopup = false;
					this.$notify({ type: 'success', message: "身份验证通过，欢迎 " + this.userName});
				} else {
					this.$toast.fail(res.data.msg);
				}
			}).catch(function (error) {
				this.hideLoding();
				console.log(error);
			    alert(error);
			});
		},
		/**
		 * 日历
		 */
		selectCalendar(selectDate) {
			console.log(selectDate);
		},
		/**
		 * 打卡
		 */
		punchClick() {
			var now = new Date();
			this.punchTimeSelect = now.getHours() + ":" + now.getMinutes();
			this.showPunchPopup = true;
		},
		punchCancel() {
			this.showPunchPopup = false;
		},
		punchConfirm() {
			this.punchTimeResult = this.punchTimeSelect;
			this.showPunchPopup = false;
			console.log("selectTime: " + this.punchTimeResult);
		},
		/**
		 * 报表
		 */
		 clickReport() {
		 	this.$toast.fail("报表功能开发中哦~~~");
		 },
		/**
		 * 弹窗
		 */
		showLoding() {
			this.lodingStatus = true;
		},
		hideLoding() {
			this.lodingStatus = false;
		}

	}
});
