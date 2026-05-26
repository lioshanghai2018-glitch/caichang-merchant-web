import axios from 'axios'

const uniCloud = axios.create({
  baseURL: 'https://fc-mp-ae9bd108-da40-4ae6-923b-c3007dedec12.next.bspapp.com/merchant-api'
})

uniCloud.callMethod = (method, params = {}) => {
  return uniCloud.post(`/${method}`, { method, params })
}

export default uniCloud