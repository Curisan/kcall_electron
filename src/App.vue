<template>
    <div id="app">
        <transition name="move" mode="out-in">
            <keep-alive>
                <router-view></router-view>
            </keep-alive>
        </transition>
    </div>
</template>

<script>
import axios from "axios";

export default {
    name: "App",
};

// window.onbeforeunload = function (e) {
//   axios
//   .post("/api/logout", {
//       user: localStorage.getItem("user"),
//   })
//   .then(function (response) {
//       var res = response.data;
//       if (res.code != 0) {
//           alert(res.msg);
//       } else {
//           console.log("logout success.")
//       }
//       })
//   .catch(function (error) {
//       alert(error);
//   });
// };
</script>

<style>
    @import "./assets/css/main.css";
</style>
