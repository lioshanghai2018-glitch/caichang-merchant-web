import uniCloud from './uniCloud'

export const getProducts = (params = {}) => uniCloud.callMethod('getProducts', params)

export const addProduct = (data) => uniCloud.callMethod('addProduct', data)

export const updateProduct = (id, data) => uniCloud.callMethod('updateProduct', { id, ...data })

export const deleteProduct = (id) => uniCloud.callMethod('deleteProduct', { id })

export const uploadImage = (base64Data, fileName) => uniCloud.callMethod('uploadImage', {
  imageData: base64Data,
  fileName: fileName
})

// 数据修复
export const fixProductCategories = () => uniCloud.callMethod('fixProductCategories', {})

// 诊断
export const diagnoseCategories = () => uniCloud.callMethod('diagnoseCategories', {})

// 调试
export const debugCategoryPage = () => uniCloud.callMethod('debugCategoryPage', {})
