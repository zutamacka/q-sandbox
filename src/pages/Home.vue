<template>
  <q-page class="constrain q-pa-md">
    <q-list bordered class="rounded-borders" >
     
      <q-item-label header>Files</q-item-label>
     
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
      loadingPosts: false,
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
  },
  computed: {},
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
