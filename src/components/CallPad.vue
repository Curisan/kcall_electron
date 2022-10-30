<template>
    <div>
        <div class="web-phone-wrap">
            <el-tabs v-model="activeTabsName" @tab-click="handleTabsClick">
                <el-tab-pane label="拨号盘" name="first" style="height: 400px">
                    <el-row type="flex" justify="center">
                        <el-input v-model="phone_number">
                        </el-input>
                    </el-row>
                    <el-row type="flex" justify="center" :gutter="10" v-for="(item, index) in [0,1,2,3]">
                        <el-col v-for="(jtem, jndex) in [0,1,2]">
                            <el-button @click="handleNumber(item, jtem)" :disabled="button_disable" size="small">{{button_key[item*3+jtem]}}</el-button>
                        </el-col>
                    </el-row>
                    <el-row type="flex" justify="center" :gutter="10">
                        <el-col>
                            <el-tooltip content="后退" placement="top" effect="light" :open-delay="1000">
                                <el-button @click="handleBack()" :disabled="button_disable" size="small">Del</el-button>
                            </el-tooltip>
                        </el-col>
                        <el-col>
                            <el-button @click="handleAdd()" :disabled="button_disable" size="small">+</el-button>
                        </el-col>
                        <el-col>
                            <el-tooltip content="清除" placement="top" effect="light" :open-delay="1000">
                                <el-button @click="handleClear()" :disabled="button_disable" size="small">C</el-button>
                            </el-tooltip>
                        </el-col>
                    </el-row>
                    <el-row type="flex" justify="center">
                        <el-button :disabled="button_disable" @click="handleCall()" v-if="call_phase.is_dialing==false && call_phase.is_talking==false" size="small">呼叫</el-button>
                        <el-button :disabled="button_disable" @click="handleCall()" v-if="call_phase.is_dialing==true || call_phase.is_talking==true" size="small">结束</el-button>
                    </el-row>
                    <el-row class="speaker-detect">
                        <el-col :span="4"><i class="el-icon-bell"></i></el-col>
                        <el-col v-if="device_ok==false" :span="20"><span style="color: red; font-size: 14px">未检测到扬声器！</span></el-col>
                        <el-col v-if="device_ok==true" :span="20">
                            <el-progress :percentage="speaker_soundmeter" :show-text="false"></el-progress>
                        </el-col>
                    </el-row>
                    <el-row>
                        <el-col :span="4"><i class="el-icon-microphone"></i></el-col>
                        <el-col v-if="device_ok==false" :span="20"><span style="color: red; font-size: 14px">未检测到麦克风！</span></el-col>
                        <el-col v-if="device_ok==true" :span="20">
                            <el-progress :percentage="microphone_soundmeter" :show-text="false"></el-progress>
                        </el-col>
                    </el-row>
                    <el-row type="flex" justify="center" class="calling-info">
                        <el-col v-if="call_phase.is_talking==true">已连接 {{call_dur_str}}</el-col>
                        <el-col v-if="call_phase.is_talking==false">{{state_info}}</el-col>
                    </el-row>
                </el-tab-pane>
                <el-tab-pane label="呼叫记录" name="second" style="height: 400px">
                    <el-table :data="callRecordTableData" size="mini" height="380px" style="width: 100%">
                        <el-table-column prop="remote_number" label="号码" width="100px">
                        </el-table-column>
                        <el-table-column prop="direction" label="方向" width="50px">
                        </el-table-column>
                        <el-table-column prop="start_time" label="时间" width="140px">
                        </el-table-column>
                        <el-table-column prop="duration" label="通话时间">
                        </el-table-column>
                        <el-table-column prop="connection_info" label="信息">
                        </el-table-column>
                    </el-table>
                </el-tab-pane>
            </el-tabs>
        </div>

        <el-dialog title="电话呼入" :visible="dialogVisible" width="30%" :append-to-body="true" :close-on-press-escape="false" :before-close="handleDialogClose">
            <el-row style="text-align: center;">{{incoming_number}}</el-row>
            <el-row type="flex" :gutter="20">
                <el-col :span="12">
                    <el-button @click="handleAnswer()" type="primary">接听</el-button>
                </el-col>
                <el-col :span="12">
                    <el-button @click="handleReject()">拒绝</el-button>
                </el-col>
            </el-row>
        </el-dialog>
    </div>
</template>

<script>
import axios from "axios";

var outgoingSession = null;
var incomingSession = null;
var currentSession = null;

var audio = new window.Audio();

var constraints = {
    audio: true,
    video: false,
};
URL = window.URL || window.webkitURL;

var localStream = null;
var userAgent = null;
var timer = null;

// 案件播放器
var soundPlayer = new window.Audio();
soundPlayer.volume = 1;

// 录音
var remote_mediaRecorder = null;
var chunks = [];
var record_timer = null;

// 音量刷新
var meterRefresh = null;
var meterRefresh_local = null;

var hangup_timer = null;

const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
console.log("supportedConstraints: ", supportedConstraints);

export default {
    name: "CallPad",
    data: function () {
        return {
            // 标签页管理
            activeTabsName: "first",

            settingVisible: false, // 设置可视化
            dialogVisible: false, // 接听对话框可视化
            phone_number: "", // 拨号号码
            button_key: [
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "*",
                "0",
                "#",
                "<",
                "+",
                "C",
            ],
            dialpad_key: [
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "A",
                "0",
                "B",
                "C",
                "D",
                "pound",
            ],
            button_disable: true,
            call_phase: {
                is_dialing: false, // 拨号中
                is_talking: false, // 谈话中
            },
            call_dur: 0, // 拨号时长
            call_dur_str: "", // 拨号时长显示
            state_info: "离线", // 状态信息

            sip_ip: "",
            sip_port: "",
            wss_port: "",
            extension_number: "",
            permission: "",
            extension_number_password: "",
            extension_number_port: "",

            // sip_uri: "sip:1019@192.168.1.69:5060",
            // sip_password: "1234",
            // wss_uri: "wss://192.168.1.69:7443",
            sip_uri: "",
            sip_password: "",
            wss_uri: "",

            incoming_number: "", // 来电电话号码
            incoming_session: null, // 来电session
            device_ok: false, // 音频设备是否就绪

            microphone_soundmeter: 0, // 麦克风音量
            speaker_soundmeter: 0, // 扬声器音量

            currentUrl: "",

            // 呼叫记录
            callRecordTableData: [],
            session_start_time: null,

            // 拨号错误
            count_sip_err: 0,

            user_name: "",
            call_id: "",
        };
    },
    created() {
        let that = this;

        // hangup any existing call
        try {
            currentSession.terminate();
        } catch {}
        currentSession = null;
        console.log("in created currentSession: ", currentSession);

        // 查询fs_config，分机号和密码
        that.get_init_config();
        // 获取呼叫记录
        that.get_call_record();

        that.user_name = localStorage.getItem("user");
    },
    mounted() {
        window.addEventListener(
            "beforeunload",
            this.beforeUnloadHandler,
            false
        );
        this.currentUrl = window.location.href;

        let that = this;
        document.onkeyup = function (e) {
            let ev = document.all ? window.event : e;
            if (ev.keyCode === 13) {
                that.handleCall();
            }
        };
    },
    beforeRouteLeave(to, from, next) {
        this.$confirm(
            "离开此页面将无法接听来电且当前如有通话会自动挂断！！！",
            "离开此页面？",
            {
                confirmButtonText: "离开",
                cancelButtonText: "取消",
                type: "warning",
            }
        )
            .then(() => {
                // confirmButton回调
                next();
            })
            .catch(() => {
                // cancelButton回调，把当前页路由推回
                // 不能使用this.$router进行路由操作，会触发beforeRouteLeave导致死循环
                window.history.pushState("", "", this.currentUrl);
            });
    },
    back() {
        // 页面中按键触发
        this.$router.go(-1);
    },
    destroyed() {
        let that = this;
        window.removeEventListener(
            "beforeunload",
            this.beforeUnloadHandler,
            false
        );
        console.log("destory.....");
        if (
            that.call_phase.is_dialing == true ||
            that.call_phase.is_talking == true
        ) {
            soundPlayer.setAttribute("src", "sounds/hangup.wav");
            soundPlayer.removeAttribute("loop");
            soundPlayer.play();
            setTimeout(function () {
                that.webphoneStop(currentSession);
            }, 1000);
            console.log("hangup......");
        }

        // 键盘监听事件取消
        document.onkeydown = null;

        clearInterval(timer);
        clearInterval(hangup_timer);
        clearInterval(meterRefresh);
        clearInterval(meterRefresh_local);
    },
    methods: {
        handleNumber(item, jtem) {
            // console.log(item, jtem)
            var cur_index = item * 3 + jtem;
            var cur_key = this.button_key[cur_index];
            if (cur_index < 12) {
                this.phone_number = this.phone_number + cur_key;
            } else if (cur_index == 12) {
                // console.log("phone number length: ", this.phone_number.length)
                if (this.phone_number.length > 0) {
                    this.phone_number = this.phone_number.substring(
                        0,
                        this.phone_number.length - 1
                    );
                }
            } else if (cur_index == 13) {
                this.phone_number = this.phone_number + cur_key;
            } else {
                this.phone_number = "";
            }

            soundPlayer.setAttribute(
                "src",
                "sounds/dialpad/" + this.dialpad_key[cur_index] + ".wav"
            );
            soundPlayer.removeAttribute("loop");
            soundPlayer.play();

            if (this.call_phase.is_talking == true) {
                currentSession.sendDTMF(cur_key);
                console.log("sendDTMF: ", cur_key);
            }
        },
        handleBack() {
            if (this.phone_number.length > 0) {
                this.phone_number = this.phone_number.substring(
                    0,
                    this.phone_number.length - 1
                );
            }
        },
        handleAdd() {
            this.phone_number = this.phone_number + "+";
        },
        handleClear() {
            this.phone_number = "";
        },
        handleCall() {
            let that = this;
            if (
                that.call_phase.is_dialing == false &&
                that.call_phase.is_talking == false
            ) {
                that.count_sip_err = 0;
                that.webphoneCall(that.phone_number);
                that.call_phase.is_dialing = true;
            } else {
                soundPlayer.setAttribute("src", "sounds/hangup.wav");
                soundPlayer.removeAttribute("loop");
                soundPlayer.play();
                setTimeout(function () {
                    that.webphoneStop(currentSession);
                }, 1000);
            }
        },
        handleDialogClose(done) {
            this.$confirm("确认关闭？")
                .then((_) => {
                    done();
                })
                .catch((_) => {});
        },
        handleAnswer() {
            console.log("接听--------------");
            this.call_phase.is_dialing = false;
            this.call_phase.is_talking = true;
            // console.log("session: ", this.incoming_session)
            this.dialogVisible = false;
            soundPlayer.pause();
            this.answer_incoming(this.incoming_session);
        },
        handleReject() {
            this.dialogVisible = false;
            // this.incoming_session.terminate()
            // clearInterval(timer)
            // this.call_dur = 0
            // this.call_dur_str = ""
            // console.log("reject call.")
            // soundPlayer.pause()
            console.log("reject call.");
            this.webphoneStop(this.incoming_session);
        },
        // handleSettingHide(){
        //     // sip_uri_ = this.sip_uri;
        //     // sip_password_ = this.sip_password;
        //     // ws_uri_ = this.wss_uri;
        //     this.settingVisible = false
        //     this.state_info = "离线"
        //     this.webphoneStart();
        // },

        // 查看是否有音频设备
        check_device() {
            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.enumerateDevices
            ) {
                console.log("不支持获取设备信息！");
            } else {
                // 获取音视频数据的api，这里需要给浏览器授权。audio和video都为true表示采集的既有音频又有视频数据
                navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false,
                });
                // 获取音视频设备，成功调用gotDevices方法，失败调用handleError方法
                navigator.mediaDevices
                    .enumerateDevices()
                    .then(this.gotDevices)
                    .catch(this.handleError);

                // 获取音量大小
                try {
                    window.AudioContext =
                        window.AudioContext || window.webkitAudioContext;
                    window.audioContext = new AudioContext();
                } catch (e) {
                    alert("Web Audio API not supported.");
                }
            }
        },
        // 浏览器获取音视频设备成功时调用的方法
        gotDevices(deviceInfos) {
            deviceInfos.forEach(function (deviceInfo) {
                console.log(
                    "设备种类=" +
                        deviceInfo.kind +
                        "：设备名 = " +
                        deviceInfo.label +
                        "；设备id = " +
                        deviceInfo.deviceId +
                        "；groupId=" +
                        deviceInfo.groupId
                );
            });
            this.device_ok = true;
        },
        // 浏览器获取音视频设备失败时调用的方法
        handleError(err) {
            console.log(err.name + ":" + err.message);
            this.device_ok = false;
        },
        webphoneStart() {
            let that = this;
            // 根据实际修改
            var sip_uri_ = that.sip_uri; //"sip:1019@192.168.1.69:5060";
            var sip_password_ = that.sip_password; // "1234";
            var ws_uri_ = that.wss_uri; //"wss://192.168.1.69:7443";

            console.info(
                "get input info: sip_uri = ",
                sip_uri_,
                " sip_password = ",
                sip_password_,
                " ws_uri = ",
                ws_uri_
            );
            var socket = new JsSIP.WebSocketInterface(ws_uri_);
            var configuration = {
                sockets: [socket],
                outbound_proxy_set: ws_uri_,
                uri: sip_uri_, //与用户代理关联的SIP URI（字符串）。这是您的提供商提供给您的SIP地址
                password: sip_password_, //SIP身份验证密码
                register: true, //指示启动时JsSIP用户代理是否应自动注册
                session_timers: false, //启用会话计时器（根据RFC 4028）
            };

            userAgent = new JsSIP.UA(configuration);

            //连接失败
            userAgent.on("disconnected", function (data) {
                that.button_disable = true;
                console.log("连接失败");
            });

            //成功注册成功,data:Response JsSIP.IncomingResponse收到的SIP 2XX响应的实例
            userAgent.on("registered", function (data) {
                that.state_info = "在线";
                that.button_disable = false;
                console.info(
                    "registered: ",
                    data.response.status_code,
                    ",",
                    data.response.reason_phrase
                );
            });

            //由于注册失败而被解雇,data:Response JsSIP.IncomingResponse接收到的SIP否定响应的实例，如果失败是由这样的响应的接收产生的，否则为空
            userAgent.on("registrationFailed", function (data) {
                that.state_info = "离线";
                // console.log("registrationFailed, ", data);
                //console.warn("registrationFailed, ", data.response.status_code, ",", data.response.reason_phrase, " cause - ", data.cause);
            });

            //1.在注册到期之前发射几秒钟。如果应用程序没有为这个事件设置任何监听器，JsSIP将像往常一样重新注册。
            // 2.如果应用程序订阅了这个事件，它负责ua.register()在registrationExpiring事件中调用（否则注册将过期）。
            // 3.此事件使应用程序有机会在重新注册之前执行异步操作。对于那些在REGISTER请求中的自定义SIP头中使用外部获得的“令牌”的环境很有用。
            // userAgent.on('registrationExpiring', function () {
            //   console.warn("registrationExpiring");
            // });

            //为传入或传出会话/呼叫激发。data:
            //     originator：'remote',新消息由远程对等方生成；'local',新消息由本地用户生成。
            //      session:JsSIP.RTCSession 实例。
            //      request:JsSIP.IncomingRequest收到的MESSAGE请求的实例；JsSIP.OutgoingRequest传出MESSAGE请求的实例
            userAgent.on("newRTCSession", function (data) {
                console.info("onNewRTCSession: ", data);
                that.session_start_time = new Date().Format(
                    "yyyy-MM-dd hh:mm:ss"
                );
                if (data.originator == "remote") {
                    //incoming call
                    console.info("incomingSession, wait answer the call");
                    that.dialogVisible = true;
                    console.log("that.dialogVisible 1: ", that.dialogVisible);
                    incomingSession = data.session;
                    console.log("that.dialogVisible 2: ", that.dialogVisible);

                    // hangup any existing call
                    try {
                        currentSession.terminate();
                    } catch {}
                    console.log("that.dialogVisible 3: ", that.dialogVisible);

                    currentSession = incomingSession;
                    console.log("that.dialogVisible 4: ", that.dialogVisible);

                    var incoming_user =
                        incomingSession.remote_identity.uri.user;
                    console.log("that.dialogVisible 5: ", that.dialogVisible);

                    // that.answer(incoming_user, currentSession)

                    that.dialogVisible = true;
                    console.log("that.incoming_number 6");
                    that.incoming_number = incoming_user;
                    console.log(
                        "that.incoming_number 6.1: ",
                        that.incoming_number
                    );
                    console.log("that.dialogVisible 7: ", that.dialogVisible);
                    that.incoming_session = currentSession;
                    console.log("that.dialogVisible 8: ", that.dialogVisible);

                    soundPlayer.setAttribute("src", "sounds/ringtone.wav");
                    soundPlayer.setAttribute("loop", "loop");
                    soundPlayer.play();
                    console.log("that.dialogVisible 9: ", that.dialogVisible);
                    that.dialogVisible = true;
                    console.info("that.dialogVisible 10: ", that.dialogVisible);
                } else {
                    console.info("outgoingSession"); // 呼出
                    that.state_info = "拨号中...";

                    outgoingSession = data.session;

                    // hangup any existing call
                    try {
                        currentSession.terminate();
                    } catch {}

                    currentSession = outgoingSession;
                    outgoingSession.on("connecting", function (data) {
                        // console.info('onConnecting - ', data.request);
                        // currentSession = outgoingSession;
                        outgoingSession = null;
                    });
                    //拿到远程的音频流  data.session.connection: The underlying RTCPeerConnection(webrtc实例)
                    data.session.connection.addEventListener(
                        "addstream",
                        function (ev) {
                            // console.info('onaddstream from remote - ', ev.stream);
                            audio.srcObject = ev.stream;
                        }
                    );
                }

                //接受呼叫时激发
                data.session.on("accepted", function (data) {
                    console.info("onAccepted - ", data);

                    console.info(
                        "-----------------------accept phone------------------------"
                    );
                });

                //确认呼叫后激发
                data.session.on("confirmed", function (data) {
                    console.info("onConfirmed - ", data);
                    that.state_info = "在线";
                    that.call_phase.is_dialing = false;
                    that.call_phase.is_talking = true;

                    // set DTMF
                    var localStream =
                        currentSession.connection.getLocalStreams()[0];
                    var dtmfSender = currentSession.connection.createDTMFSender(
                        localStream.getAudioTracks()[0]
                    );
                    currentSession.sendDTMF = function (tone) {
                        dtmfSender.insertDTMF(tone);
                    };

                    timer = setInterval(function () {
                        that.call_dur = that.call_dur + 1;
                        var minutes = Math.floor(that.call_dur / 60);
                        var seconds = that.call_dur - minutes * 60;
                        if (seconds < 10) {
                            that.call_dur_str =
                                minutes.toString() + ":0" + seconds.toString();
                        } else {
                            that.call_dur_str =
                                minutes.toString() + ":" + seconds.toString();
                        }
                        // console.log("call_dur: ", that.call_dur)
                    }, 1000);
                });

                //结束后激发 （接完电话挂机会走这个）
                data.session.on("ended", function (data) {
                    console.info("onended - ", data);
                    // console.info('currentSession - ', currentSession);

                    // 生成呼叫记录
                    that.generate_call_record(currentSession, data);
                    that.webphoneStop(currentSession);

                    // 对方挂机提示
                    if (data.originator == "remote") {
                        hangup_timer = setInterval(function () {
                            soundPlayer.setAttribute(
                                "src",
                                "sounds/remote_hangup.wav"
                            );
                            soundPlayer.removeAttribute("loop");
                            soundPlayer.play();
                        }, 500);

                        setTimeout(function () {
                            clearInterval(hangup_timer);
                        }, 2000);
                    }
                });

                //失败后激发（未接电话时，挂机会触发）
                data.session.on("failed", function (data) {
                    console.info("onfailed - ", data);
                    // console.info('currentSession - ', currentSession);

                    // 失败原因分析
                    if (data.message != null) {
                        if (data.message.status_code == 503) {
                            that.webphoneStop(currentSession);
                            alert("无可用电话卡，请联系管理员！！！");
                            return;
                        }

                        // 480错误重新拨号
                        if (data.message.status_code == 480) {
                            if (that.count_sip_err < 5) {
                                setTimeout(
                                    that.webphoneCall(that.phone_number),
                                    2000
                                );
                                that.count_sip_err += 1;
                                console.log(
                                    "--------------480 error---------------, retry: ",
                                    that.count_sip_err
                                );
                                return;
                            } else {
                                alert("您拨打的电话暂时无法接通，请稍后再拨！");
                            }
                        }
                    }

                    that.generate_call_record(currentSession, data);
                    if (data.originator == "remote") {
                        that.dialogVisible = false;
                        console.log(
                            "onfailed that.dialogVisible： ",
                            that.dialogVisible
                        );
                    }
                    that.webphoneStop(currentSession);
                });

                //在将远程SDP传递到RTC引擎之前以及在发送本地SDP之前激发。此事件提供了修改传入和传出SDP的机制。
                data.session.on("sdp", function (data) {
                    // console.info('onSDP, type - ', data.type, ' sdp - ', data.sdp);
                    //data.sdp = data.sdp.replace('UDP/TLS/RTP/SAVPF', 'RTP/SAVPF');
                    //console.info('onSDP, changed sdp - ', data.sdp);
                });

                //接收或生成对邀请请求的1XX SIP类响应（>100）时激发。该事件在SDP处理之前触发（如果存在），以便在需要时对其进行微调，甚至通过删除数据对象中响应参数的主体来删除它
                data.session.on("progress", function (data) {
                    console.info("onProgress - ", data.originator);
                    if (data.originator == "remote") {
                        console.info("onProgress, response - ", data.response);
                    }
                });

                //创建基础RTCPeerConnection后激发。应用程序有机会通过在peerconnection上添加RTCDataChannel或设置相应的事件侦听器来更改peerconnection。
                data.session.on("peerconnection", function (data) {
                    // console.info('onPeerconnection - ', data.peerconnection);
                    data.peerconnection.onaddstream = function (ev) {
                        // console.info('onaddstream from remote ev - ', ev);

                        // 录音
                        const options = {
                            mimeType: "audio/webm;codecs=pcm",
                        };
                        remote_mediaRecorder = new MediaRecorder(
                            ev.stream,
                            options
                        );
                        remote_mediaRecorder.start();
                        console.log(
                            "remote_mediaRecorder state: ",
                            remote_mediaRecorder.state
                        );

                        remote_mediaRecorder.ondataavailable = function (e) {
                            // console.log("e: ", e)
                            // chunks.push(e.data);
                        };

                        remote_mediaRecorder.onstop = function (e) {
                            // console.log("remote_mediaRecorder stop....")
                            // console.log("chunks: ", chunks)
                            // const blob = new Blob(chunks, { 'type': 'audio/webm;codecs=pcm' });
                            // chunks = [];
                            // const audioURL = URL.createObjectURL(blob);
                            // console.log("audioURL: ", audioURL)
                            // const link = document.createElement("a");
                            // link.href = audioURL;
                            // link.setAttribute("download", "output.webm"); //or any other extension
                            // document.body.appendChild(link);
                            // link.click();
                        };

                        // record_timer = setInterval(function(){
                        // remote_mediaRecorder.requestData()
                        // }, 1000)

                        // 获取音量： remote
                        window.stream = ev.stream;

                        // 调试
                        var remo_stream = ev.stream;
                        console.log("remo_stream: ", remo_stream);
                        var audioTrack = remo_stream.getAudioTracks()[0];
                        console.log("audioTrack: ", audioTrack);
                        var audioConstraints = audioTrack.getSettings();
                        console.log("audioConstraints: ", audioConstraints);

                        const soundMeter = (window.soundMeter = new SoundMeter(
                            window.audioContext
                        ));
                        soundMeter.connectToSource(ev.stream, function (e) {
                            if (e) {
                                alert(e);
                                return;
                            }
                            meterRefresh = setInterval(() => {
                                that.speaker_soundmeter =
                                    soundMeter.instant.toFixed(2) * 300;
                                if (that.speaker_soundmeter > 100) {
                                    that.speaker_soundmeter = 100;
                                }
                            }, 50);
                        });

                        // 获取音量： local
                        var localStream =
                            currentSession.connection.getLocalStreams()[0];

                        // 调试
                        console.log("localStream: ", localStream);
                        var audioTrack = localStream.getAudioTracks()[0];
                        console.log("audioTrack: ", audioTrack);
                        var audioConstraints = audioTrack.getSettings();
                        console.log("audioConstraints: ", audioConstraints);

                        window.local_stream = localStream;
                        const soundMeter_local = (window.soundMeter_local =
                            new SoundMeter(window.audioContext));
                        soundMeter_local.connectToSource(
                            localStream,
                            function (e) {
                                if (e) {
                                    alert(e);
                                    return;
                                }
                                meterRefresh_local = setInterval(() => {
                                    // console.log("soundMeter: ", soundMeter.instant.toFixed(2))
                                    that.microphone_soundmeter =
                                        soundMeter_local.instant.toFixed(2) *
                                        300;
                                    if (that.microphone_soundmeter > 100) {
                                        that.microphone_soundmeter = 100;
                                    }
                                }, 50);
                            }
                        );

                        audio.onloadstart = () => {
                            // console.log("-------audio.onloadstart-----")
                            audio.play();
                            // console.log("-------audio.onloadstart  111-----")
                        };
                        audio.onerror = () => {
                            alert("录音加载失败...");
                        };
                    };
                });
            });

            //为传入或传出消息请求激发。data:
            //     originator：'remote',新消息由远程对等方生成；'local',新消息由本地用户生成。
            //      message:JsSIP.Message 实例。
            //      request:JsSIP.IncomingRequest收到的MESSAGE请求的实例；JsSIP.OutgoingRequest传出MESSAGE请求的实例
            userAgent.on("newMessage", function (data) {
                if (data.originator == "local") {
                    console.info(
                        "onNewMessage , OutgoingRequest - ",
                        data.request
                    );
                } else {
                    console.info(
                        "onNewMessage , IncomingRequest - ",
                        data.request
                    );
                }
            });

            console.info("call register");
            //连接到信令服务器，并恢复以前的状态，如果以前停止。重新开始时，如果UA配置中的参数设置为register:true，则向SIP域注册。
            userAgent.start();
        },
        webphoneCall(phone_number) {
            // 确保phton_number不包括空格，横杠等
            while (phone_number.indexOf(" ") != -1) {
                phone_number = phone_number.replace(" ", "");
            }
            while (phone_number.indexOf("-") != -1) {
                phone_number = phone_number.replace("-", "");
            }

            this.phone_number = phone_number;

            if (phone_number == "") {
                alert("请输入正确的电话号码！");
                this.call_phase.is_dialing = false;
                return;
            }

            var sip_phone_number_ = "";
            if (phone_number.length == 4) {
                // sip_phone_number_ = "sip:" + phone_number + "@192.168.1.69:5060"
                sip_phone_number_ =
                    "sip:" +
                    phone_number +
                    "@" +
                    this.sip_ip +
                    ":" +
                    this.sip_port;
            } else {
                // var sip_phone_number_ = "sip:0" + phone_number + "@192.168.1.69:5060"
                sip_phone_number_ =
                    "sip:0" +
                    phone_number +
                    "@" +
                    this.sip_ip +
                    ":" +
                    this.sip_port;
            }

            // console.log("sip_phone_number: ", sip_phone_number_)

            var options = {
                // 'eventHandlers': eventHandlers,
                mediaConstraints: {
                    audio: true,
                    video: false,
                },

                //'mediaStream': localStream
            };

            // hangup any existing call
            try {
                currentSession.terminate();
            } catch {}
            userAgent.terminateSessions();

            outgoingSession = userAgent.call(sip_phone_number_, options);
        },
        webphoneStop(session) {
            let that = this;
            try {
                session.terminate();
            } catch {}

            that.state_info = "在线";
            that.call_phase.is_dialing = false;
            that.call_phase.is_talking = false;
            clearInterval(timer);
            that.call_dur = 0;
            that.call_dur_str = "";
            soundPlayer.pause();

            that.phone_number = "";
            clearInterval(record_timer);
            try {
                remote_mediaRecorder.stop();
            } catch {}

            // 音量
            clearInterval(meterRefresh);
            clearInterval(meterRefresh_local);
            that.speaker_soundmeter = 0;
            that.microphone_soundmeter = 0;

            console.log("Stop.");
        },
        answer_incoming(session) {
            console.log("-----------answer_incoming------------:", session);
            session.answer({
                mediaConstraints: { audio: true, video: false },
                // 'mediaStream': localStream
            });
            //拿到远程的音频流
            session.connection.addEventListener("addstream", function (ev) {
                // console.info('onaddstream from remote - ', ev.stream);
                audio.srcObject = ev.stream;
            });
        },

        // 呼叫记录
        handleTabsClick(tab, event) {
            // let that = this
            // console.log("tab...", tab, event);
            // console.log("activatename: ", that.activeTabsName)
            // if(that.activeTabsName=="second"){
            //     that.get_call_record()
            // }
        },

        // 工具函数
        get_init_config() {
            let that = this;
            that.get_fs_config();
        },
        get_fs_config() {
            let that = this;
            var access_token = localStorage.getItem("token");
            axios
                .post(
                    "/api/fs_config",
                    {
                        user: localStorage.getItem("user"),
                    },
                    {
                        headers: {
                            Authorization: `JWT ${access_token}`,
                        },
                    }
                )
                .then(function (response) {
                    var res = response.data;
                    if (res.code != 0) {
                        alert(res.msg);
                    } else {
                        that.sip_ip = res.fs_config.sip_ip;
                        that.sip_port = res.fs_config.sip_port;
                        that.wss_port = res.fs_config.wss_port;

                        console.log("sip_ip: ", that.sip_ip);
                        console.log("sip_port: ", that.sip_port);
                        console.log("wss_port: ", that.wss_port);
                        that.get_extension_number();
                    }
                })
                .catch(function (error) {
                    if (error.response.status == 401) {
                        that.$router.push({
                            path: "/",
                        });
                    }
                    console.log(error);
                });
        },
        get_extension_number() {
            let that = this;
            var access_token = localStorage.getItem("token");
            axios
                .post(
                    "/api/user_status",
                    {},
                    {
                        headers: {
                            Authorization: `JWT ${access_token}`,
                        },
                    }
                )
                .then(function (response) {
                    // console.log("response: ", response)
                    var res = response.data;
                    if (res.code != 0) {
                        alert(res.msg);
                    } else {
                        that.permission = res.permission;
                        that.extension_number = res.extension_number;
                        console.log("permission: ", that.permission);
                        console.log(
                            "extension_number: ",
                            that.extension_number
                        );
                        if (that.extension_number == "None") {
                            alert(
                                "该账号未分配手机号码，无法拨打，请联系管理员！"
                            );
                            return;
                        }
                        that.get_extension_number_password(
                            that.extension_number
                        );
                    }
                })
                .catch(function (error) {
                    if (error.response.status == 401) {
                        that.$router.push({
                            path: "/",
                        });
                    }
                    console.log(error);
                });
        },
        get_extension_number_password(extension_number) {
            let that = this;
            var access_token = localStorage.getItem("token");
            axios
                .post(
                    "/api/extension_number_status",
                    {
                        extension_number: extension_number,
                    },
                    {
                        headers: {
                            Authorization: `JWT ${access_token}`,
                        },
                    }
                )
                .then(function (response) {
                    var res = response.data;
                    if (res.code != 0) {
                        alert(res.msg);
                    } else {
                        that.extension_number_password = res.password;
                        that.extension_number_port = res.port;

                        console.log("extension_number: ", extension_number);
                        console.log(
                            "password: ",
                            that.extension_number_password
                        );

                        // 赋值
                        that.sip_uri =
                            "sip:" +
                            that.extension_number +
                            "@" +
                            that.sip_ip +
                            ":" +
                            that.sip_port;
                        that.sip_password = that.extension_number_password;
                        that.wss_uri =
                            "wss://" + that.sip_ip + ":" + that.wss_port;

                        // 检查音频设备和注册
                        that.check_device();
                        that.webphoneStart();
                    }
                })
                .catch(function (error) {
                    if (error.response.status == 401) {
                        that.$router.push({
                            path: "/",
                        });
                    }
                    console.log(error);
                });
        },
        beforeUnloadHandler(e) {
            e.returnValue = "离开此页面？"; // 此处返回任意字符串，不返回null即可，不能修改默认提示内容
        },
        generate_call_record(session, sip_msg) {
            let that = this;

            var direction = session.direction;

            // 本地分机号直接从local拿
            var extension_number = localStorage.getItem("extension_number");

            var remote_number = that.convert_remote_number(
                session.remote_identity.uri.user
            );
            var start_time = that.session_start_time;
            var talk_start_time = session.start_time;
            var talk_end_time = session.end_time;
            var duration = (talk_end_time - talk_start_time) / 1000;
            var call_id = session.request.call_id;
            that.call_id = call_id;

            // 连接信息
            var connection_info = "";
            if (duration > 0) {
                connection_info = "呼叫结束";
            } else {
                if (
                    sip_msg.message != null &&
                    sip_msg.message.status_code == 480
                ) {
                    connection_info = "网络问题";
                } else {
                    connection_info = "未接通";
                }
            }

            var new_record_db = {
                user_name: localStorage.getItem("user"),
                extension_number: extension_number,
                remote_number: remote_number,
                direction: direction,
                create_time: start_time,
                call_id: call_id,
                duration: duration,
                connection_info: connection_info,
            };

            var new_record = {
                remote_number: remote_number,
                direction: direction == "outgoing" ? "呼出" : "呼入",
                start_time: start_time,
                duration: duration == 0 ? "" : duration,
                connection_info: connection_info,
            };

            console.log("direction: ", direction);
            console.log("extension_number: ", extension_number);
            console.log("remote_number: ", remote_number);
            console.log("duration: ", duration.toFixed(2));
            console.log("connection_info: ", connection_info);
            console.log("call_id: ", call_id);
            console.log("start_time: ", start_time);

            // 记录到数据库
            that.add_call_record(new_record_db, new_record);
        },
        convert_remote_number(remote_number) {
            if (remote_number[0] == "0") {
                return remote_number.substring(1, remote_number.length);
            } else {
                return remote_number;
            }
        },
        add_call_record(new_record_db, new_record) {
            console.log("add_call_record...............");
            let that = this;
            var access_token = localStorage.getItem("token");
            axios
                .post(
                    "/api/add_call_record",
                    {
                        user_name: new_record_db.user_name,
                        extension_number: new_record_db.extension_number,
                        remote_number: new_record_db.remote_number,
                        direction: new_record_db.direction,
                        create_time: new_record_db.create_time,
                        call_id: new_record_db.call_id,
                        duration: new_record_db.duration,
                        connection_info: new_record_db.connection_info,
                    },
                    {
                        headers: {
                            Authorization: `JWT ${access_token}`,
                        },
                    }
                )
                .then(function (response) {
                    var res = response.data;
                    // console.log("res: ", res)
                    if (res.code != 0) {
                        alert(res.msg);
                    } else {
                        that.callRecordTableData.reverse();
                        that.callRecordTableData.push(new_record);
                        that.callRecordTableData.reverse();
                    }
                })
                .catch(function (error) {
                    if (error.response.status == 401) {
                        that.$router.push({
                            path: "/",
                        });
                    }
                    alert(error);
                });
        },
        get_call_record() {
            console.log("add_call_record...............");
            let that = this;
            var access_token = localStorage.getItem("token");
            axios
                .get("/api/call_record", {
                    headers: {
                        Authorization: `JWT ${access_token}`,
                    },
                })
                .then(function (response) {
                    var res = response.data;
                    // console.log("res: ", res)
                    if (res.code != 0) {
                        alert(res.msg);
                    } else {
                        that.callRecordTableData.reverse();
                        for (
                            var ii = 0;
                            ii < res.call_record_list.length;
                            ii++
                        ) {
                            var direction = res.call_record_list[ii].direction;
                            var duration = res.call_record_list[ii].duration;
                            var new_record = {
                                remote_number:
                                    res.call_record_list[ii].remote_number,
                                direction:
                                    direction == "outgoing" ? "呼出" : "呼入",
                                start_time:
                                    res.call_record_list[ii].create_time,
                                duration: duration == 0 ? "" : duration,
                                connection_info:
                                    res.call_record_list[ii].connection_info,
                            };
                            that.callRecordTableData.push(new_record);
                        }
                        that.callRecordTableData.reverse();
                    }
                })
                .catch(function (error) {
                    if (error.response.status == 401) {
                        that.$router.push({
                            path: "/",
                        });
                    }
                    alert(error);
                });
        },
    },
};

Date.prototype.Format = function (fmt) {
    // author: meizz
    var o = {
        "M+": this.getMonth() + 1, // 月份
        "d+": this.getDate(), // 日
        "h+": this.getHours(), // 小时
        "m+": this.getMinutes(), // 分
        "s+": this.getSeconds(), // 秒
        "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
        S: this.getMilliseconds(), // 毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(
            RegExp.$1,
            (this.getFullYear() + "").substr(4 - RegExp.$1.length)
        );
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(
                RegExp.$1,
                RegExp.$1.length == 1
                    ? o[k]
                    : ("00" + o[k]).substr(("" + o[k]).length)
            );
    return fmt;
};
</script>
<style>
div {
    text-align: left;
}
.web-phone-wrap {
    background-color: lightgray;
    padding: 20px;
    border-radius: 4px;
    width: 300px;
}

.el-row {
    margin-bottom: 10px;

    &:last-child {
        margin-bottom: 0;
    }
}

.grid-content {
    border-radius: 4px;
    min-height: 36px;
    background-color: white;
    text-align: center;
    line-height: 40px;
}

.el-button {
    width: 100%;
}

.calling-info {
    margin-bottom: 0;
    font-size: 14px;
}

.phone-number {
    text-align: right;
}

.sip-setting {
    text-align: right;
    cursor: pointer;
}

.el-loading-mask {
    height: 2000px !important;
}
.speaker-detect {
    margin-top: 20px;
}
</style>
