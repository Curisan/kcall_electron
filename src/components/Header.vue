<template>
    <div class="header" :class="{'header-collapse':collapse}">
        <div class="header-right">
            <span class="el-icon-minus" @click="minimizeWin"></span>
            <span class="el-icon-full-screen" @click="maximizeWin"></span>
            <span class="el-icon-close" @click="closeWin"></span>
        </div>
    </div>
</template>
<script>
import bus from "../components/bus";
import { remote } from "electron";

export default {
    data() {
        return {
            collapse: false,
            name: "",
        };
    },
    computed: {
        username() {
            let username = localStorage.getItem("user");
            return username ? username : this.name;
        },
    },
    created() {
        // 通过 Event Bus 进行组件间通信，来折叠侧边栏
        bus.$on("collapse", (msg) => {
            this.collapse = msg;
            // bus.$emit("collapse-content", msg);
        });
    },
    methods: {
        // 用户名下拉菜单选择事件
        handleCommand(command) {
            if (command == "loginout") {
                localStorage.clear();
                this.$router.push({
                    path: "/",
                });
            }
        },
        // 侧边栏折叠
        collapseChage() {
            this.collapse = !this.collapse;
            bus.$emit("collapse", this.collapse);
        },

        // 最小化窗口
        minimizeWin() {
            remote.getCurrentWindow().minimize(); // 窗口最小化
        },
        // 最大化窗口
        maximizeWin() {
            const win = remote.getCurrentWindow();
            if (win.isMaximized()) {
                win.restore(); // 恢复原窗口大小
            } else {
                win.maximize(); //最大化窗口
            }
        },
        // 关闭窗口
        closeWin() {
            console.log("close win.")
            remote.getCurrentWindow().close(); // 关闭窗口，也结束了所有进程
        },
    },
    mounted() {
        if (document.body.clientWidth < 1500) {
            this.collapseChage();
        }
    },
};
</script>
<style scoped>
.header {
    position: absolute;
    box-sizing: border-box;
    left: 0;
    right: 0;
    height: 45px;
    font-size: 22px;
    color: #fff;
    -webkit-transition: left 0.3s ease-in-out;
    transition: left 0.3s ease-in-out;
    background-color: #1f2435;
    -webkit-app-region: drag;
}

.el-icon-minus:hover{
    /* background-color: gray; */
}

.collapse-btn {
    float: left;
    padding: 0 21px;
    cursor: pointer;
    line-height: 45px;
}
.header .logo {
    float: left;
    width: 250px;
    line-height: 45px;
    font-size: 20px;
}
.header-right {
    float: right;
    line-height: 45px;
    -webkit-app-region: no-drag;
    /* padding-right: 50px; */
}

.header-right span {
    font-size: 20px;
    margin-right: 20px;
    height: 45px;
}
.header-user-con {
    display: flex;
    height: 45px;
    align-items: center;
}
.btn-fullscreen {
    transform: rotate(45deg);
    margin-right: 5px;
    font-size: 24px;
}
.btn-bell,
.btn-fullscreen {
    position: relative;
    width: 30px;
    height: 30px;
    text-align: center;
    border-radius: 15px;
    cursor: pointer;
}
.btn-bell-badge {
    position: absolute;
    right: 0;
    top: -2px;
    width: 8px;
    height: 8px;
    border-radius: 4px;
    background: #f56c6c;
    color: #fff;
}
.btn-bell .el-icon-bell {
    color: #fff;
}
.user-name {
    margin-left: 10px;
}
.user-avator {
    margin-left: 20px;
}
.user-avator img {
    display: block;
    width: 40px;
    height: 40px;
    border-radius: 50%;
}
.el-dropdown-link {
    color: #fff;
    cursor: pointer;
}
.el-dropdown-menu__item {
    text-align: center;
}
</style>
