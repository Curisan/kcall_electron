<template>
    <div id="myHeader">
        <div class="titlebtn">
            <!-- <div class="min" @click="min"> <img src="../assets/min.png" alt=""></div> -->
            <div class="min"><button @click="min"> - </button></div>
            <div class="max"><button @click="max"> [] </button></div>
            <div class="close"><button @click="close"> X </button></div>
        </div>
    </div>
</template>


<script>
import { ipcRenderer} from 'electron';
export default {
    data() {
        return {};
    },
    methods: {
        min() {
            ipcRenderer.send("window-min");
        },
        max() {
            ipcRenderer.send("window-max");
        },
        close() {
            ipcRenderer.send("window-close");
        },
    },
};
</script>


<style lang="scss">
#myHeader {
    width: 100%;
    height: 30px;
    line-height: 30px;
    background-color: rgb(198, 47, 47);
    -webkit-app-region: drag;
}

.titlebtn {
    position: relative;
    width: 60px;
    height: 30px;
    line-height: 30px;
    float: right;

    -webkit-app-region: no-drag;

    .min {
        position: absolute;
        background: "green";
        right: 60px;
        width: 20px;

        // img {
        //     width: 100%;

        //     margin-top: 6px;
        // }
    }
    .max {
        position: absolute;
        background: "yellow";
        right: 40px;
        width: 20px;
    }
    .close {
        position: absolute;
        background: "black";
        right: 20px;
        width: 20px;
    }
}
</style>