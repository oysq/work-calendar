Vue.use(vant.Popup);
Vue.use(vant.Field);
Vue.use(vant.Cell);
Vue.use(vant.CellGroup);
Vue.use(vant.Grid);
Vue.use(vant.GridItem);
Vue.use(vant.Divider);


Vue.prototype.$axios = axios
Vue.prototype.$axios.defaults.baseURL = 'http://excel.oysq.cloud/calendar-ms'
// Vue.prototype.$axios.defaults.baseURL = 'http://81.71.39.253:80/calendar-ms'
// Vue.prototype.$axios.defaults.baseURL = 'http://127.0.0.1:80/calendar-ms'

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
				token: "",
				postSalary: 0
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
				show: false,
				selectDate: new Date(),
				minDate: new Date("2021/06/01")
			},
			// 当月打卡记录
			punchRecord: {},
			// 打卡详情
			detail: {
				show: false,
				startTime: "",
				endTime: "",
				overtimeDuration: "",
				overtimePay: ""
			},
			// 工具盒子
			toolBox: {
				show: false,
				actions: [
					{
						name: '开始时间',
						code: "start"
					},
					{
						name: '节假倍率',
						code: "rate"
					},
					{
						name: '岗位工资',
						code: "salary"
					}
				]
			},
			// 调整开始时间弹窗
			startConf: {
				show: false,
				title: "",
				timeSelect: "",
				timeConfirm: ""
			},
			// 倍率调整
			rateAction: {
				show: false,
				defaultIndex: 0,
				columns: [
					{
						name: '1.5倍',
						value: 1.5
					},
					{
						name: '2倍',
						value: 2.0
					},
					{
						name: '3倍',
						value: 3.0
					}
				]
			},
			// 岗位工资
			salaryConf: {
				show: false,
				postSalary: 0
			}
		}
	},
	created() {
		this.checkToken();
		setTimeout(() => {

			if (navigator.userAgent.toLocaleLowerCase().includes('iphone')) {
				// @ts-ignore
				this.intervalFlag = setInterval(() => {
					document.querySelector('body').scrollTop = 0;
				}, 200);
			}
	      
			if (navigator.userAgent.toLowerCase().includes('iphone')) {
				if(document.querySelector('app-confirm-loan')) {
					document.querySelector('app-confirm-loan').addEventListener('touchmove', (e) => {
						e.preventDefault();
					});
				}
			}

	    }, 100);
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
			    		this.user.postSalary = res.data.body.postSalary
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
					this.user.postSalary = res.data.body.postSalary
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
		// 获取打卡数据
		queryCalendarList(date) {
			this.showLoding();
			this.$axios.post('/punchRecord/selectRecord',
				{
					userId: this.user.id
				}
			).then(res => {
				this.hideLoding();
				if(res.data.status == 1) {
					// TODO 遍历转为0-31的数组
					for(const index in res.data.body) {
						const item = res.data.body[index];
						this.punchRecord[item.punchDate] = item;
					}
					console.log("=== punchRecord ===");
					console.log(this.punchRecord);
					// 开始加载渲染数据
					this.calendar.show = true;
					// 首次舒心时渲染一次
					this.formatterDetail(new Date());
				} else {
					this.$toast.fail(res.data.msg);
				}
			}).catch(function (error) {
				console.log(error);
			    alert(error);
			});
		},
		// 查找结果集的数据
		findRecord(day) {

			const formatDay = this.formatDate(day, "/");
			if(formatDay in this.punchRecord) {
				return this.punchRecord[formatDay];
			}
			return null;
			
		},
		// 数据渲染规则
		formatter(day) {

			const record = this.findRecord(day.date);
			if(record) {
				if(record['endTime']) {
					day.bottomInfo = record['endTime'].split(" ")[1].substring(0, 5);
				}
			}

			return day;

		},
		// 渲染详情信息
		formatterDetail(date) {
			const record = this.findRecord(date);
			if(record) {
				this.detail.show = true;
				this.detail.startTime = record.startTime.substring(5, 16).replace("/","-");
				this.detail.endTime = record.endTime.substring(5, 16).replace("/","-");
				this.detail.overtimeDuration = record.overtimeDuration;
				this.detail.multiplyRate = record.multiplyRate;
				this.detail.overtimePay = record.overtimePay;
			} else {
				this.detail.show = false;
			}
		},
		// 某个月进入可视区域
		monthShow(obj) {
			console.log("进入可视区域: " + this.formatDate(obj.date, "-"))
		},
		// 点击某个日期
		selectCalendar(clickDate) {
			this.calendar.selectDate = clickDate
			console.log("点击日期: " + this.formatDate(clickDate, "-"));
			this.formatterDetail(this.calendar.selectDate);
		},
		/**
		 * 打卡
		 */
		punchClick() {
			this.punchPopup.title = this.formatDate(this.calendar.selectDate, "-");
			// 调整当前时间选择器的时间
			const record = this.findRecord(this.calendar.selectDate);
			if(record) {
				if(record['endTime']) {
					this.punchPopup.timeSelect = record['endTime'].split(" ")[1].substring(0, 5);
				}
			} else {
				var now = new Date();
				this.punchPopup.timeSelect = now.getHours() + ":" + now.getMinutes();
			}
			this.punchPopup.show = true;
		},
		punchCancel() {
			this.punchPopup.show = false;
		},
		punchConfirm() {

			this.punchPopup.timeConfirm = this.punchPopup.timeSelect;
			console.log("timeConfirm: " + this.punchPopup.timeConfirm);

			// 早上 08:30 之前的算前一天
			var punchDate = new Date(this.calendar.selectDate);
			if(this.punchPopup.timeConfirm.split(":")[0] <= "08" && this.punchPopup.timeConfirm.split(":")[1] < "30") {
				punchDate.setDate(punchDate.getDate() - 1)
			}

			this.punchPopup.show = false;
			
			this.showLoding();
			this.$axios.post('/punchRecord/updateEndTime',
				{
					userId: this.user.id,
					punchDate: this.formatDate(punchDate, "/"),
					endTime: this.formatDate(this.calendar.selectDate, "/") + " " + this.punchPopup.timeConfirm + ":00"
				}
			).then(res => {
				this.hideLoding();
				if(res.data.status == 1) {
					this.$notify({ type: 'success', message: "打卡成功"});
					setTimeout("window.location.reload()", 1000);
				} else {
					this.$toast.fail(res.data.msg);
				}
			}).catch(function (error) {
				console.log(error);
			    alert(error);
			});
		},
		/**
		 * 工具盒子
		 */
		toolBoxClick() {
			this.toolBox.show = true;
		},
		toolBoxSelect(item) {
			
			this.toolBox.show = false;

			// 开始时间
			if(item.code == "start") {
				this.startConfClick();
			}

			// 倍率
			if(item.code == "rate") {
				this.rateActionShow();
			}

			// 岗位薪资
			if(item.code == "salary") {
				this.salaryShow();
			}
		},
		/**
		 * 调整开始时间
		 */
		startConfClick() {
			this.startConf.title = this.formatDate(this.calendar.selectDate, "-");
			// 调整当前时间选择器的时间
			const record = this.findRecord(this.calendar.selectDate);
			if(record) {
				if(record['startTime']) {
					this.startConf.timeSelect = record['startTime'].split(" ")[1].substring(0, 5);
				}
			} else {
				this.startConf.timeSelect = "18:00";
			}
			this.startConf.show = true;
		},
		startConfConfirm() {

			this.startConf.timeConfirm = this.startConf.timeSelect;
			console.log("timeConfirm: " + this.startConf.timeConfirm);

			// 早上 08:30 之前的算前一天
			var punchDate = new Date(this.calendar.selectDate);
			if(this.startConf.timeConfirm.split(":")[0] <= "08" && this.startConf.timeConfirm.split(":")[1] < "30") {
				startConf.setDate(punchDate.getDate() - 1)
			}
			console.log(punchDate)

			this.startConf.show = false;
			
			this.showLoding();
			this.$axios.post('/punchRecord/updateStartTime',
				{
					userId: this.user.id,
					punchDate: this.formatDate(punchDate, "/"),
					startTime: this.formatDate(this.calendar.selectDate, "/") + " " + this.startConf.timeConfirm + ":00"
				}
			).then(res => {
				this.hideLoding();
				if(res.data.status == 1) {
					this.$notify({ type: 'success', message: "调整成功"});
					setTimeout("window.location.reload()", 1000);
				} else {
					this.$toast.fail(res.data.msg);
				}
			}).catch(function (error) {
				console.log(error);
			    alert(error);
			});
		},
		/**
		 * 倍率调整
		 */
		// 设置默认值并弹出
		rateActionShow() {
			// 设置默认值
			const record = this.findRecord(this.calendar.selectDate);
			if(record) {
				if(record['multiplyRate']) {
					if(record['multiplyRate'] == 1.5) {
						this.rateAction.defaultIndex = 0;
					} else if (record['multiplyRate'] == 2.0) {
						this.rateAction.defaultIndex = 1;
					} else if (record['multiplyRate'] == 3.0) {
						this.rateAction.defaultIndex = 2;
					} else {
						this.rateAction.defaultIndex = 0;
					}
				}
			}
			this.rateAction.show = true;
		},
		// 倍率确认
		rateActionConfirm(item) {

			this.rateAction.show = false;
			
			this.showLoding();
			this.$axios.post('/punchRecord/updateMultiplyRate',
				{
					userId: this.user.id,
					punchDate: this.formatDate(this.calendar.selectDate, "/"),
					multiplyRate: item.value
				}
			).then(res => {
				this.hideLoding();
				if(res.data.status == 1) {
					this.$notify({ type: 'success', message: "调整成功"});
					setTimeout("window.location.reload()", 1000);
				} else {
					this.$toast.fail(res.data.msg);
				}
			}).catch(function (error) {
				console.log(error);
			    alert(error);
			});
		},
		/**
		 * 岗位工资调整
		 */
		salaryShow() {

			if(this.user.postSalary) {
				this.salaryConf.postSalary = this.user.postSalary;
			}

			this.salaryConf.show = true;

		},
		salaryConfirm() {

			this.salaryConf.show = false;

			this.showLoding();
			this.$axios.post('/user/updatePostSalary',
				{
					userId: this.user.id,
					postSalary: this.salaryConf.postSalary
				}
			).then(res => {
				this.hideLoding();
				if(res.data.status == 1) {
					this.$notify({ type: 'success', message: "设置成功"});
					setTimeout("window.location.reload()", 1000);
				} else {
					this.$toast.fail(res.data.msg);
				}
			}).catch(function (error) {
				console.log(error);
			    alert(error);
			});

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
		},
		// 判断是否为空
		isBlank(obj) {
		    if(typeof obj == "undefined" || obj == null || obj == ""){
		        return true;
		    }else{
		        return false;
		    }
		}

	}
});







