<template>
       <q-item clickable v-ripple @click="showFile">
        <q-item-section avatar>
           <q-icon color="secondary" name="bluetooth" />
        </q-item-section>

        <q-item-section>
          <q-item-label caption lines="2">
            {{post.caption}}
          </q-item-label>
        </q-item-section>

        <q-item-section>
          <q-item-label caption lines="2">
            {{post.description}}
          </q-item-label>
        </q-item-section>

        <q-item-section>
          <q-item-label caption lines="2">
            {{niceDate(post.date)}}
          </q-item-label>
        </q-item-section>

         <q-item-section>
          <q-btn
              flat
              round
              class="q-pa-xs"
              color="secondary"
              icon="delete"
              @click="deletePost"
            />
         </q-item-section>



      </q-item>
</template>

<script>
import { date } from 'quasar'
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
      console.log('show the file', this.post.fileUrl);
      javascipt:window.open(this.post.fileUrl);
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
  },
})
</script>

<style lang="sass"></style>
