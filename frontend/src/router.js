import { createRouter, createWebHistory } from 'vue-router'
import CampaignsView from './views/CampaignsView.vue'
import CampaignDetailView from './views/CampaignDetailView.vue'
import ProfileView from './views/ProfileView.vue'
import OwnerView from './views/OwnerView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'campaigns', component: CampaignsView },
    { path: '/campaign/:id', name: 'campaign', component: CampaignDetailView, props: true },
    { path: '/profile', name: 'profile', component: ProfileView },
    { path: '/owner', name: 'owner', component: OwnerView },
  ],
})
