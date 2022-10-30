<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/> -->
    <CallPad></CallPad>
  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
import CallPad from './components/CallPad.vue'

export default {
  name: 'App',
  components: {
    CallPad
  }
}
</script>

<style>
* {
    margin: 0;
    padding: 0;
}

html,
body,
#app,
.wrapper {
    width: 100%;
    height: 100%;
    overflow: hidden;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
