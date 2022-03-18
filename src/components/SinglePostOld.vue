<template>
  <q-item class="col-10" clickable v-ripple @click="onClick">
    <q-item-section class="col-1" avatar>
      <q-icon color="secondary" name="picture_as_pdf" />
    </q-item-section>

    <q-item-section class="col-9">
      <q-item-label caption lines="1">
        {{ post.caption }}
      </q-item-label>
    </q-item-section>

    <q-item-section>
      <q-item-label caption lines="2">
        {{ niceDate(post.date) }}
      </q-item-label>
    </q-item-section>
  </q-item>

  <div class="col-1">
    <q-btn
      flat
      round
      class="q-pa-xs"
      color="secondary"
      icon="delete"
      @click="deletePost"
    />
  </div>

  <div class="col-1">
    <q-btn
      flat
      round
      class="q-pa-xs"
      color="secondary"
      icon="border_color"
      @click="djidj"
    />
  </div>

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
import { date } from 'quasar'
import { defineComponent } from 'vue'
import { ref } from 'vue'
export default defineComponent({
  name: 'SinglePost',
  props: {
    post: Object,
    name: String,
  },
  setup(props) {
    const showDialog = ref(false)

    function onClick() {
      showDialog.value = true
    }

    function hideDialog() {
      showDialog.value = false
    }
    return {
      src: `../catalogues/${props.post.fileUrl.split('\\').pop()}`,
      title: props.post.caption.substring(0, 50),
      showDialog,
      onClick,
      hideDialog,
    }
  },
  data() {
    return {}
  },
  methods: {
    showFile() {
      this.$emit('fileUrl', this.post.fileUrl)
    },
    niceDate(value) {
      return date.formatDate(value, 'MMMM DD h:mmA')
    },
    deletePost() {
      // this.$q.loading.show({
      //   message: 'Deleting...',
      // })
      console.log(this.post.id)
      this.$axios
        .delete(`${process.env.API}/delete/${this.post.id}`)
        .then((response) => {
          console.log('response', response)
          // send to the Home page after a successful post
          this.$router.push('/')
          // notify about posting
          this.$q.notify({
            message: 'Post deleted.',
            actions: [
              {
                label: 'Dismiss',
                color: 'primary',
              },
            ],
          })
        })
        .catch((err) => {
          console.log('error ', err)
          this.$q.dialog({
            title: 'Error',
            message: 'Deleting failed.',
          })
        })
        .finally(() => {
          // this.$q.loading.hide()
        })
    },
    djidj() {
      console.log('Test djdij')
    },
    // this is a testing function for uploading content to typesense
    djidja() {
      console.log('I log the djidja')
      this.$q.loading.show({
        message: 'Djidjing...',
      })

      console.log(this.post)

      let formData = new FormData()
      formData.append('fileUrl', this.post.fileUrl)
      formData.append('fileName', this.post.id)
      this.$axios
        .post(`${process.env.API}/pdf-test`, formData)
        .then((response) => {
          console.log(response)
          // send to the Home page after a successful post
          this.$router.push('/')
          // notify about posting
          this.$q.notify({
            message: 'Djidja Done.',
            actions: [
              {
                label: 'Dismiss',
                color: 'primary',
              },
            ],
          })
        })
        .catch((err) => {
          console.log('error ', err)
          this.$q.dialog({
            title: 'Error',
            message: 'Djidja failed.',
          })
        })
        .finally(() => {
          this.$q.loading.hide()
        })
    },
  },
})
</script>

<style lang="sass"></style>
