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
			user: {
				name: "",
				password: "",
				id: "",
				token: ""
			},
			// 打卡弹窗
			punchPopup: {
				show: false,
				title: "",
				timeSelect: "",
				timeConfirm: ""
			},
			// 日历
			calendar: {
				selectDate: new Date()
			},
			// 当月打卡记录
			punchRecord: {

			}
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
			this.user.token = window.localStorage.getItem('authToken')
			if (!this.user.token) {
				this.hideLoding();
				this.$toast.fail("需要登录一下哦");
				this.showAuthPopup = true
				return
			}
			this.$axios.post('/user/checkToken', 
					{
						token: this.user.token
					}
				).then(res => {
					this.hideLoding();
			    	if(res.data.status == 1) {
			    		this.user.id = res.data.body.userId
				   	    this.$notify({ type: 'success', message: "身份验证通过，欢迎 " + res.data.body.userName});
				   	    // 加载数据
				   	    this.queryCalendarList(this.calendar.selectDate);
					} else {
						this.$toast.fail("有点久了哦，重新登录一下昂");
				        this.showAuthPopup = true
					    return
					}
				}).catch(function (error) {
					console.log(error);
				    alert(error);
				});
		},
		// 获取token
		getToken() {
			this.showLoding();
			this.$axios.post('/user/checkUserExists',
					{
						userName: this.user.name
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
										userName: this.user.name,
										password: this.user.password
									}
								).then(res => {
									if(res.data.status == 1) {

										// 刷新token
				   	    				this.refreshToken();

									} else {
										this.$toast.fail(res.data.msg);
									}
								}).catch(function (error) {
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
					console.log(error);
				    alert(error);
				});
		},
		// 刷新token
		refreshToken() {
			this.$axios.post('/user/refreshToken',
				{
					userName: this.user.name,
					password: this.user.password
				}
			).then(res => {
				if(res.data.status == 1) {
					this.user.id = res.data.body.userId
					window.localStorage.setItem("authToken", res.data.body.token);
					this.showAuthPopup = false;
					this.$notify({ type: 'success', message: "身份验证通过，欢迎 " + res.data.body.userName});
					// 加载数据
				   	this.queryCalendarList(this.calendar.selectDate);
				} else {
					this.$toast.fail(res.data.msg);
				}
			}).catch(function (error) {
				console.log(error);
			    alert(error);
			});
		},
		/**
		 * 日历
		 */
		queryCalendarList(date) {
			this.showLoding();
			this.$axios.post('/punchRecord/selectRecord',
				{
					userId: this.user.id,
					startDate: this.formatDate(this.getFirstDayOfMonth(date), "/"),
					endDate: this.formatDate(this.getLastDayOfMonth(date), "/")
				}
			).then(res => {
				this.hideLoding();
				if(res.data.status == 1) {
					// TODO 遍历转为0-31的数组
					
					this.punchRecord[this.formatMonth(date, "-")] = res.data.body;
					console.log(this.punchRecord)
				} else {
					this.$toast.fail(res.data.msg);
				}
			}).catch(function (error) {
				console.log(error);
			    alert(error);
			});
		},
		selectCalendar(clickDate) {
			this.calendar.selectDate = clickDate
			console.log("clickDate: " + clickDate);
		},
		/**
		 * 打卡
		 */
		punchClick() {
			this.punchPopup.title = this.formatDate(this.calendar.selectDate, "-");
			// TODO 有打卡的要切换到对应的时间
			var now = new Date();
			this.punchPopup.timeSelect = now.getHours() + ":" + now.getMinutes();
			this.punchPopup.show = true;
		},
		punchCancel() {
			this.punchPopup.show = false;
		},
		punchConfirm() {
			this.punchPopup.timeConfirm = this.punchPopup.timeSelect;
			this.punchPopup.show = false;
			console.log("timeConfirm: " + this.punchPopup.timeConfirm);
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
		},
		/**
		 * 工具
		 */
		// 返回某月第一天
		getFirstDayOfMonth: function(date) {
			return new Date(date.getFullYear(), date.getMonth(), 1);
		},
		// 返回某月最后一天
		getLastDayOfMonth: function(date) {
			return new Date(date.getFullYear(), date.getMonth() + 1, 0);
		},
		// 返回 类似 2020/01/01 格式的字符串
		formatDate(date, ch) {

			var year = date.getFullYear();
			var month = (date.getMonth() + 1);
			var day = date.getDate();

			month < 10 && (month = '0' + month);
			day < 10 && (day = '0' + day);

			return (year + ch + month + ch + day);
		},
		// 返回 类似 2020/01 格式的字符串
		formatMonth(date, ch) {

			var year = date.getFullYear();
			var month = (date.getMonth() + 1);

			month < 10 && (month = '0' + month);

			return (year + ch + month);
		}

	}
});







