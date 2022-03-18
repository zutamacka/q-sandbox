<template>
  <q-page class="constrain q-pa-md">
    <div class="q-pa-md">
      <div class="row">
        <div class="col-12">
          <q-input v-model="searchPhrase" class="" label="Search *" dense>
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>

          <q-list bordered separator :class="uploaded">
            <template v-if="posts.length">
              <found-post v-for="post in posts" :key="post.id" :post="post" />
            </template>
          </q-list>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { date } from 'quasar'
import SinglePost from '../components/SinglePost.vue'
import SkeletonPost from '../components/SkeletonPost.vue'
import NoPosts from '../components/NoPosts.vue'
import FoundPost from '../components/FoundPost.vue'
import Typesense from 'typesense'

export default defineComponent({
  components: { SinglePost, SkeletonPost, NoPosts, FoundPost },
  name: 'PageHome',
  data() {
    return {
      posts: [],
      searchPhrase: '',
      loadingPosts: false,
      uploaded: 'rounded',
      TsenseClient: new Typesense.Client({
        nodes: [
          {
            host: process.env.TYPESENSE_NODES, //Typesense Cloud cluster
            port: '443',
            protocol: 'https',
          },
        ],
        apiKey: process.env.TYPESENSE_API_KEY,
        connectionTimeoutSeconds: 2,
      }),
      Collection: process.env.TYPESENSE_COLLECTION,
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
          /// console.log(this.posts.length, this.posts)
          if (this.posts.length > 0) {
            this.uploaded = 'rounded row'
          }
        })
        .catch((err) => {
          this.$q.dialog({
            title: 'Error',
            message: 'Data Not Loaded.',
          })
          console.log('error: ', err)
        })
        .finally(() => {
          this.loadingPosts = false
        })
    },
  },
  watch: {
    searchPhrase(value) {
      console.log(value)

      if (this.searchPhrase.length) {
        let searchParameters = {
          q: this.searchPhrase,
          query_by: 'text',
          // group_by: 'fileUrl',
          // filter_by: 'fileUrl',
          // sort_by: 'num_employees:desc',
        }
        this.TsenseClient.collections(this.Collection)
          .documents()
          .search(searchParameters)
          .then((data) => {
            this.posts = []
            data.hits.forEach((hit) => {
              // console.log(hit.document)
              this.posts.push(hit.document)
            })
          })
          .then(() => {
            console.log('found posts: ', this.posts.length)
          })
      } else {
        this.foundPosts = []
      }
    },
  },
  created() {
    this.getPosts()
  },
})
</script>
<style lang="sass"></style>
