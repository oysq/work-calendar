Vue.use(vant.Popup);
Vue.use(vant.Field);
Vue.use(vant.Cell);
Vue.use(vant.CellGroup);

new Vue({
	el: '#app',
	data: function() {
		return {
			// 日历
			currentYear: 1970,
			currentMonth: 1, // 当前月
			currentDay: 1, // 当前天
			currentWeek: 0, // 一号所在的星期
			days: [], // 当月所有天数
			content: {},
			sign_days: [], // 签到日期
			is_sign: false,
			currentPlan: {},
			show: false,
			// 用户信息
			userName: "",
			userPassword: ""
		}
	},
	created: function() {
		// window.localStorage.setItem("token", "100");
		// alert(window.localStorage.getItem('token'))
		this.getSign();
	},
	methods: {
		/**
		 * 获取签到日期
		 */
		getSign: function() {
			// 模拟数据
			var sign_days = [{
				day: '2021/12/8',
				is_sign: 0
			}, {
				day: '2021/12/9',
				is_sign: 0
			}, {
				day: '2021/12/10',
				is_sign: 0
			}, {
				day: '2021/12/11',
				is_sign: 0
			}, {
				day: '2021/12/12',
				is_sign: 1
			}, {
				day: '2021/12/13',
				is_sign: 1
			}];
			this.sign_days = sign_days;
			this.initData(null);
			this.show = true
		},
		initData: function(cur) {
			var today;
			if (cur) { // 切换上一月、下一月
				today = new Date(cur);
			} else {
				today = new Date(); // 此处取本机时间，应改为服务器时间
			}

			this.currentYear = today.getFullYear(); // 当前年份
			this.currentMonth = today.getMonth() + 1; // 当前月份
			this.currentDay = today.getDate(); // 今日日期 几号
			this.currentWeek = today.getDay(); // 当前月1号是星期几？ 0表示星期天
			console.log("current: " + this.currentYear + " " + this.currentMonth + " " + this.currentDay + " " + this.currentWeek);

			// 是否当前月
			var isCurrentMonth = 0;
			// console.log(new Date().getFullYear())
			// console.log(new Date().getMonth()+1)
			if (this.currentYear == (new Date().getFullYear()) && this.currentMonth == (new Date().getMonth()+1)) {
				isCurrentMonth = 1;
			}
			// console.log(isCurrentMonth)

			// 当月第一天和最后一天
			var firstDay = this.getFirstDay(today);
			var lastDay = this.getLastDay(today);
			
			this.days = []; // 初始化日期

			// 设置上一个月 需显示 的最后几天  铺满一周
			for (var i = firstDay.getDay(); i > 0; i--) {
				var d = new Date(firstDay);
				d.setDate(d.getDate() - i);
				var dayobject = {
					day: d,
					isSign: this.existJob(d),
					isSigned: this.existSign(d)
				}; // 用一个对象包装Date对象  以便为以后预定功能添加属性
				this.days.push(dayobject); // 将日期放入data 中的days数组 供页面渲染使用
			}
			
			// 设置当前月的数据
			for (var j = firstDay.getDate(); j <= lastDay.getDate(); j++) {
				var d = new Date(today);
				d.setDate(j);
				var dayobject = {
					day: d,
					isSign: this.existJob(d),
					isSigned: this.existSign(d),
					isChecked: (isCurrentMonth && (today.getDate() === j)) ? 1 : 0
				};
				this.days.push(dayobject);
			}

			// 设置下一个月 需显示 的最前几天铺满一周
			for (var k = 1; k <= 6 - lastDay.getDay(); k++) {
				var d = new Date(lastDay);
				d.setDate(d.getDate() + k);
				var dayobject = {
					day: d,
					isSign: this.existJob(d),
					isSigned: this.existSign(d)
				}; // 用一个对象包装Date对象  以便为以后预定功能添加属性
				this.days.push(dayobject); // 将日期放入data 中的days数组 供页面渲染使用
			}
		},
		/**
		 * 判断该日期是否有任务
		 * @param d
		 * @returns {boolean}
		 */
		existJob: function(d) {
			var signdays = [];
			for (var i in this.sign_days) {
				signdays.push(this.sign_days[i].day);
			}
			return signdays.includes(d.toLocaleDateString());
		},
		/**
		 * 判断该日期是否有任务并且已完成
		 * @param d
		 * @returns {boolean}
		 */
		existSign: function(d) {
			var signdays = [];
			for (var i in this.sign_days) {
				if (this.sign_days[i].is_sign) {
					signdays.push(this.sign_days[i].day);
				}
			}
			return signdays.includes(d.toLocaleDateString());
		},
		/**
		 * 上一月
		 * @param year
		 * @param month
		 */
		pickPre: function(year, month) {
			var d = new Date(this.formatDate(year, month, 1));
			d.setDate(0);
			this.initData(this.formatDate(d.getFullYear(), d.getMonth() + 1, 1));
		},
		/**
		 * 下一月
		 * @param year
		 * @param month
		 */
		pickNext: function(year, month) {
			var d = new Date(this.formatDate(year, month, 1));
			d.setDate(35);
			this.initData(this.formatDate(d.getFullYear(), d.getMonth() + 1, 1));
		},
		// 返回本月第一天
		getFirstDay: function(date) {
			return new Date(date.getFullYear(), date.getMonth(), 1);
		},
		// 返回本月最后一天
		getLastDay: function(date) {
			return new Date(date.getFullYear(), date.getMonth() + 1, 0);
		},
		// 返回 类似 2020/01/01 格式的字符串
		formatDate: function(year, month, day) {
			month < 10 && (month = '0' + month);
			day < 10 && (day = '0' + day);
			var data = year + '/' + month + '/' + day;
			return data;
		},
		/**
		 * 点击日期查询
		 * @param index
		 */
		dayCheck: function(day) {
			console.log('day', day)

			// 初始化
			var currentPlan = {
				title: '',
				date: '',
				list: []
			};

			// 标题
			currentPlan.date = day.day.toLocaleDateString().split('/')[1] + '月' + day.day.toLocaleDateString().split('/')[2] + '日';
			
			// 点击效果
			for (var i in this.days) {
				this.$set(this.days[i], 'isChecked', 0)
			}
			this.$set(day, 'isChecked', 1);
			
			// 计划
			if (day.isSign) {
				if (day.isSigned) {
					currentPlan.list = [{
						name: '17:20',
					}, {
						name: '18:36',
					}, {
						name: '19:20',
					}];
					currentPlan.title = '打卡次数×' + currentPlan.list.length;
					currentPlan.name = '20:37';
					currentPlan.nums = 157;
				} else {
					currentPlan.title = '未打卡'
				}

			} else {
				currentPlan.title = '暂无任务'
			}

			// 渲染
			this.currentPlan = currentPlan
		}
	}
});
