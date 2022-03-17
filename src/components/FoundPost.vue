<template>
  <q-item class="col-12" clickable v-ripple @click="showFile">
    <q-item-section class="col-2" avatar>
      <q-icon color="secondary" name="picture_as_pdf" />
    </q-item-section>

    <q-item-section class="col-10">
      <q-item-label caption lines="1">
        {{ post.caption }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
import { defineComponent } from 'vue'
//import { fireDB } from '../boot/firebase.js';
export default defineComponent({
  name: 'SinglePost',
  props: {
    post: Object,
    name: String,
  },
  created() {},
  data() {
    return {}
  },
  methods: {
    showFile() {
      console.log('show the file', this.post.fileUrl)
      javascipt: window.open(this.post.fileUrl)
    },
    djidj() {
      console.log('djidj.')
    },
  },
})
</script>

<style lang="sass"></style>
