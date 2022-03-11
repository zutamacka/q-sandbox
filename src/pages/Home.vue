<template>
  <q-page class="constrain q-pa-md">
    <q-item>
      <q-item-section>
        <q-input v-model="searchPhrase" class="col col-sm-8" label="Search *" dense>
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-item-section>
      <q-item-section>
        <q-item-label caption lines="2">{{ computedResult }} </q-item-label>
      </q-item-section>
    </q-item>

    <q-item-label header>Files</q-item-label>

    <q-list bordered separator :class="uploaded">
      <template v-if="!loadingPosts && posts.length">
        <single-post v-for="post in posts" :key="post.id" :post="post" />
      </template>

      <template v-else-if="!loadingPosts && !posts.length">
        <no-posts />
      </template>
      <template v-else>
        <skeleton-post />
      </template>
    </q-list>
    <q-item>
      <q-pdfviewer type="html5" src="https://www.orimi.com/pdf-test.pdf"
    /></q-item>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { date } from 'quasar'
import SinglePost from '../components/SinglePost.vue'
import SkeletonPost from '../components/SkeletonPost.vue'
import NoPosts from '../components/NoPosts.vue'
export default defineComponent({
  components: { SinglePost, SkeletonPost, NoPosts },
  name: 'PageHome',
  data() {
    return {
      posts: [],
      foundPosts: [],
      searchPhrase: '',
      loadingPosts: false,
      uploaded: 'rounded',
    }
  },
  methods: {
    niceDate(value) {
      return date.formatDate(value, 'MMMM DD h:mmA')
    },
    getPosts() {
      this.loadingPosts = true
      // load posts from Heroku server via axios & express
      this.$axios
        .get(`${process.env.API}/posts`)
        .then((response) => {
          this.posts = response.data
          console.log(this.posts.length, this.posts)
          if (this.posts.length > 0) {
            this.uploaded = 'rounded row'
            console.log(this.uploaded)
          }
        })
        .catch((err) => {
          this.$q.dialog({
            title: 'Error',
            message: 'Data Not Loaded.',
          })
        })
        .finally(() => {
          this.loadingPosts = false
        })
    },
    searchPosts() {
      this.loadingPosts = true
      // load posts from Heroku server via axios & express
      if (this.posts.length > 0) {
        this.posts.forEach((post) => {
          console.log(post.fileUrl)
        })
      }
    },
  },
  computed: {
    computedResult() {
      // this.searchPosts()
      return this.searchPhrase
    },
  },
  created() {
    this.getPosts()
  },
})
</script>
<style lang="sass">
.card-post
  .q-img
    min-height:200px
</style>
