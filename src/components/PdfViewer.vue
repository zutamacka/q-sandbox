<template>
  <!-- Pdfjs viewer dialog -->
  <q-dialog v-model="showDialog" :maximized="$q.screen.lt.md">
    <q-card
      class="no-scroll bg-secondary"
      style="min-width: 80vw; min-height: 90vh; width: 100%; height: 100%"
    >
      <q-bar class="bg-brand-light">
        <p class="text-subtitle2 q-ma-md" style="color: white">{{ title }}</p>
        <q-space></q-space>
        <q-btn @click="hideDialog" color="white" flat icon="close"></q-btn>
      </q-bar>

      <div class="fit">
        <q-pdfviewer type="pdfjs" :src="src" />
      </div>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'PdfViewer',
  props: {
    post: Object,
    showDialog: Boolean,
  },
  setup(props) {
    //const showDialog = ref(props.showDial)
    return {
      src: `../catalogues/${props.post.fileUrl.split('\\').pop()}`,
      title: props.post.caption.substring(0, 50),
    }
  },
  data() {
    return {}
  },
  methods: {
    hideDialog() {
      this.$emit('hideDialog', false)
    },
  },
  // watch: {
  //   showDialog() {
  //     console.log('watched: ', this.showDialog)
  //   },
  // },
})
</script>

<style lang="sass"></style>
