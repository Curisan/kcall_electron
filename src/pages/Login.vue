<template>
    <div v-if="isCh == true" class="login-wrap">
        <div class="ms-login">
            <div class="ms-title">会议转录大王</div>
            <el-input class="input-number" v-model="user" placeholder="请输入账号"></el-input>
            <el-input class="input-passwd" v-model="passwd" placeholder="请输入密码" minlength="6" type="password" :show-password="true"></el-input>
            <el-button class="button-login" type="primary" plain @click="handleLogin()">登录</el-button>
        </div>
    </div>
</template>

<script>
import axios from "axios";
export default {
    name: "Login",
    data() {
        return {
            user: "",
            passwd: "",
            isCh: false,
        };
    },
    created() {
        let that = this;

        // 判断是否是chrome浏览器
        that.isCh = that.isChrome();
        console.log("isChrome: ", that.isCh);
        if (that.isCh == false) {
            alert("仅支持Google Chrome浏览器！！！");
            return;
        }

        // 接后端
        // var access_token = localStorage.getItem("token");
        // axios
        //     .get("/api/login", {
        //         headers: {
        //             Authorization: `JWT ${access_token}`,
        //         },
        //     })
        //     .then(function (response) {
        //         var res = response.data;
        //         if (res.code == 0) {
        //             that.$router.push({
        //                 path: "/home",
        //             });
        //         }
        //     })
        //     .catch(function (error) {
        //         console.log(error);
        //     });

        this.$router.push({path: "/home", });

    },
    methods: {
        handleLogin() {
            let that = this;
            console.log(that.user, that.passwd);

            // 接后端
            // axios
            //     .post("/api/login", {
            //         user: that.user,
            //         passwd: that.passwd,
            //     })
            //     .then(function (response) {
            //         console.log(response.data);
            //         var res = response.data;
            //         if (res.code != 0) {
            //             alert(res.msg);
            //         } else {
            //             localStorage.setItem("user", that.user);
            //             localStorage.setItem("token", res.token);
            //             that.$router.push({
            //                 path: "/home",
            //             });
            //         }
            //     })
            //     .catch(function (error) {
            //         console.log(error);
            //     });
            this.$router.push({path: "/home", });

        },
        isChrome() {
            const isChromium = window.chrome;
            const winNav = window.navigator;
            const vendorName = winNav.vendor;
            const isOpera = typeof window.opr !== "undefined";
            const isIEedge = winNav.userAgent.indexOf("Edge") > -1;
            const isIOSChrome = winNav.userAgent.match("CriOS");

            return (
                isIOSChrome ||
                (isChromium !== null &&
                    typeof isChromium !== "undefined" &&
                    vendorName === "Google Inc." &&
                    isOpera === false &&
                    isIEedge === false)
            );
        },
    },
};
</script>

<style scoped>
.login-wrap {
    position: relative;
    width: 100%;
    height: 100%;
    background-image: url(../assets/img/login-bg.jpg);
    background-size: cover;
}

.ms-login {
    position: absolute;
    left: 50%;
    top: 50%;
    margin: -190px 0 0 -175px;
    width: 350px;
    /* height: 300px; */
    background: rgba(255, 255, 255, 0.8);
    overflow: hidden;
    border-radius: 5px;
    padding: 10px 30px 40px 30px;
    box-sizing: border-box;
}

.ms-title {
    width: 100%;
    line-height: 50px;
    text-align: center;
    font-size: 20px;
    color: rgb(28, 23, 23);
    border-bottom: 1px solid rgb(190, 178, 178);
}
.input-number {
    margin-top: 20px;
}
.input-passwd {
    margin-top: 30px;
    margin-bottom: 30px;
}
.button-login {
    width: 100%;
}
</style>
