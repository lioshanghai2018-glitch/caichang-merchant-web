<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFlashSale, saveFlashSale, getFlashSaleProducts, addFlashSaleProduct, updateFlashSaleProduct, deleteFlashSaleProduct } from '../api/flashSale'
import { getProducts } from '../api/products'

const loading = ref(false)
const productDialogVisible = ref(false)
const selectProductDialogVisible = ref(false)

// 特惠活动
const flashSale = ref(null)
const flashSaleForm = ref({
  id: null,
  name: '限时特惠活动',
  startTime: new Date(),
  endTime: new Date(Date.now() + 86400000 * 7),
  status: true
})

// 特惠商品列表
const flashSaleProducts = ref([])
const productLoading = ref(false)

// 添加/编辑商品表单
const productForm = ref({
  id: null,
  name: '',
  image: '',
  originalPrice: 0,
  flashPrice: 0,
  stock: 99,
  specs: [{ name: '默认', price: 0, stock: 99 }]
})
const productFormRef = ref(null)
const imageUrlInput = ref('')

// 商品库
const productLibrary = ref([])
const selectedProductIds = ref([])

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }]
}

// 计算活动状态
const saleStatus = computed(() => {
  if (!flashSale.value) return '未设置'
  const now = Date.now()
  if (!flashSale.value.status) return '已禁用'
  if (now < flashSale.value.startTime) return '未开始'
  if (now > flashSale.value.endTime) return '已结束'
  return '进行中'
})

const extractData = (res) => {
  let data = res?.data
  // 如果 data 是数组，直接返回
  if (Array.isArray(data)) return data
  // 如果 data 是对象，取 data.data
  if (data && !Array.isArray(data)) {
    if (Array.isArray(data.data)) return data.data
    // 单个对象（如 getFlashSale 返回）
    if (data._id || data.id) return data
    return null
  }
  return null
}

// 加载特惠活动
const fetchFlashSale = async () => {
  try {
    const res = await getFlashSale()
    console.log('getFlashSale 响应:', res)
    console.log('res.data:', res?.data)
    const data = extractData(res)
    console.log('extractData 结果:', data)
    if (data && data._id) {
      flashSale.value = data
      flashSaleForm.value = {
        id: data._id,
        name: data.name || '限时特惠活动',
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        status: data.status
      }
    } else {
      flashSale.value = null
      flashSaleForm.value = {
        id: null,
        name: '限时特惠活动',
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000 * 7),
        status: true
      }
    }
    console.log('flashSale.value:', flashSale.value)
  } catch (e) {
    console.error('获取特惠活动失败:', e)
    flashSale.value = null
  }
}

// 保存特惠活动
const saveFlashSaleData = async () => {
  try {
    const res = await saveFlashSale({
      id: flashSaleForm.value.id,
      name: flashSaleForm.value.name,
      startTime: flashSaleForm.value.startTime.getTime(),
      endTime: flashSaleForm.value.endTime.getTime(),
      status: flashSaleForm.value.status
    })
    console.log('保存响应:', res)
    ElMessage.success('保存成功')
    // 直接更新 flashSale.value
    flashSale.value = {
      _id: res.data?.data?.id || flashSaleForm.value.id,
      name: flashSaleForm.value.name,
      startTime: flashSaleForm.value.startTime.getTime(),
      endTime: flashSaleForm.value.endTime.getTime(),
      status: flashSaleForm.value.status
    }
    flashSaleForm.value.id = flashSale.value._id
    fetchFlashSaleProducts()
  } catch (e) {
    console.error('保存失败:', e)
    ElMessage.error('保存失败: ' + (e.message || '请检查云函数'))
  }
}

// 加载特惠商品
const fetchFlashSaleProducts = async () => {
  productLoading.value = true
  try {
    const params = flashSale.value ? { flashSaleId: flashSale.value._id } : {}
    const res = await getFlashSaleProducts(params)
    flashSaleProducts.value = extractData(res) || []
  } catch (e) {
    console.error('获取特惠商品失败:', e)
  } finally {
    productLoading.value = false
  }
}

// 打开添加商品弹窗
const openAddProductDialog = () => {
  productForm.value = {
    id: null,
    name: '',
    image: '',
    originalPrice: 0,
    flashPrice: 0,
    stock: 99,
    specs: [{ name: '默认', price: 0, stock: 99 }]
  }
  imageUrlInput.value = ''
  productDialogVisible.value = true
}

// 打开编辑商品弹窗
const openEditProductDialog = (row) => {
  productForm.value = {
    id: row._id,
    name: row.name || '',
    image: row.image || '',
    originalPrice: row.originalPrice || 0,
    flashPrice: row.flashPrice || 0,
    stock: row.stock || 0,
    specs: row.specs?.length ? [...row.specs] : [{ name: '默认', price: 0, stock: 99 }]
  }
  imageUrlInput.value = row.image || ''
  productDialogVisible.value = true
}

// 保存商品
const saveProduct = async () => {
  if (!flashSale.value) {
    ElMessage.warning('请先保存特惠活动')
    return
  }

  try {
    const data = {
      flashSaleId: flashSale.value._id,
      name: productForm.value.name,
      image: productForm.value.image,
      originalPrice: productForm.value.originalPrice,
      flashPrice: productForm.value.flashPrice,
      stock: productForm.value.stock,
      specs: productForm.value.specs.filter(s => s.name)
    }

    if (productForm.value.id) {
      await updateFlashSaleProduct(productForm.value.id, data)
      ElMessage.success('更新成功')
    } else {
      await addFlashSaleProduct(data)
      ElMessage.success('添加成功')
    }
    productDialogVisible.value = false
    fetchFlashSaleProducts()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

// 删除商品
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该商品吗？', '提示', { type: 'warning' })
    await deleteFlashSaleProduct(row._id)
    ElMessage.success('删除成功')
    fetchFlashSaleProducts()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

// 从商品库选择
const openSelectProductDialog = async () => {
  if (!flashSale.value) {
    ElMessage.warning('请先保存特惠活动')
    return
  }
  try {
    loading.value = true
    const res = await getProducts()
    console.log('商品库原始数据:', res)
    const data = extractData(res)
    console.log('解析后数据:', data)
    productLibrary.value = data || []
    selectedProductIds.value = []
    if (productLibrary.value.length === 0) {
      ElMessage.warning('商品库为空，请先添加商品')
    }
    selectProductDialogVisible.value = true
  } catch (e) {
    console.error('获取商品库失败:', e)
    ElMessage.error('获取商品库失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

// 添加选中的商品
const addSelectedProducts = async () => {
  if (selectedProductIds.value.length === 0) {
    ElMessage.warning('请选择商品')
    return
  }
  try {
    for (const productId of selectedProductIds.value) {
      const product = productLibrary.value.find(p => p._id === productId)
      if (product) {
        await addFlashSaleProduct({
          flashSaleId: flashSale.value._id,
          name: product.name,
          image: product.images?.[0] || '',
          originalPrice: product.specs?.[0]?.price || 0,
          flashPrice: product.specs?.[0]?.price || 0,
          stock: product.specs?.[0]?.stock || 99,
          specs: product.specs || []
        })
      }
    }
    ElMessage.success('添加成功')
    selectProductDialogVisible.value = false
    fetchFlashSaleProducts()
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

// 添加图片
const addImage = () => {
  if (!imageUrlInput.value) {
    ElMessage.warning('请输入图片地址')
    return
  }
  productForm.value.image = imageUrlInput.value
  imageUrlInput.value = ''
}

// 规格管理
const addSpec = () => {
  productForm.value.specs.push({ name: '', price: 0, stock: 99 })
}

const removeSpec = (index) => {
  if (productForm.value.specs.length > 1) {
    productForm.value.specs.splice(index, 1)
  }
}

onMounted(() => {
  fetchFlashSale()
  fetchFlashSaleProducts()
})
</script>

<template>
  <div class="flash-sale">
    <h2 class="page-title">特惠管理</h2>

    <!-- 活动设置 -->
    <el-card class="sale-card">
      <template #header>
        <div class="card-header">
          <span>活动设置</span>
          <el-tag :type="saleStatus === '进行中' ? 'success' : saleStatus === '已结束' ? 'info' : 'warning'">
            {{ saleStatus }}
          </el-tag>
        </div>
      </template>
      <el-form :model="flashSaleForm" label-width="120px">
        <el-form-item label="活动名称">
          <el-input v-model="flashSaleForm.name" placeholder="请输入活动名称" style="width: 300px;" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="flashSaleForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 220px;"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="flashSaleForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 220px;"
            :disabled-date="(date) => date.getTime() < flashSaleForm.startTime.getTime()"
          />
        </el-form-item>
        <el-form-item label="启用活动">
          <el-switch v-model="flashSaleForm.status" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveFlashSaleData">保存活动设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 特惠商品列表 -->
    <el-card class="sale-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>特惠商品</span>
          <div>
            <el-button type="primary" size="small" @click="openSelectProductDialog">从商品库添加</el-button>
            <el-button type="success" size="small" @click="openAddProductDialog">新增商品</el-button>
          </div>
        </div>
      </template>

      <el-table :data="flashSaleProducts" v-loading="productLoading" stripe>
        <el-table-column prop="name" label="商品名称" min-width="150" />
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image v-if="row.image" :src="row.image" style="width: 50px; height: 50px;" fit="cover" />
            <span v-else style="color: #999;">无图</span>
          </template>
        </el-table-column>
        <el-table-column label="原价" width="100">
          <template #default="{ row }">
            ¥{{ row.originalPrice }}
          </template>
        </el-table-column>
        <el-table-column label="特惠价" width="100">
          <template #default="{ row }">
            <span style="color: #ff4d4f; font-weight: bold;">¥{{ row.flashPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存" width="80">
          <template #default="{ row }">
            {{ row.stock }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditProductDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="flashSaleProducts.length === 0 && !productLoading" description="暂无特惠商品" />
    </el-card>

    <!-- 添加/编辑商品弹窗 -->
    <el-dialog v-model="productDialogVisible" :title="productForm.id ? '编辑商品' : '添加商品'" width="600px">
      <el-form :model="productForm" :rules="rules" ref="productFormRef" label-width="100px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品图片">
          <div style="display: flex; align-items: center; gap: 10px;">
            <el-input v-model="imageUrlInput" placeholder="输入图片URL" style="flex: 1;" />
            <el-button @click="addImage">添加</el-button>
          </div>
          <el-image v-if="productForm.image" :src="productForm.image" style="width: 100px; height: 100px; margin-top: 10px;" fit="cover" />
        </el-form-item>
        <el-form-item label="原价">
          <el-input-number v-model="productForm.originalPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="特惠价">
          <el-input-number v-model="productForm.flashPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="productForm.stock" :min="0" />
        </el-form-item>
        <el-form-item label="规格">
          <div v-for="(spec, index) in productForm.specs" :key="index" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <el-input v-model="spec.name" placeholder="规格名称" style="width: 100px;" />
            <span>价格</span>
            <el-input-number v-model="spec.price" :min="0" :precision="2" style="width: 100px;" />
            <span>库存</span>
            <el-input-number v-model="spec.stock" :min="0" style="width: 100px;" />
            <el-button v-if="productForm.specs.length > 1" type="danger" link @click="removeSpec(index)">删除</el-button>
          </div>
          <el-button type="primary" link @click="addSpec">+ 添加规格</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">确定</el-button>
      </template>
    </el-dialog>

    <!-- 从商品库选择弹窗 -->
    <el-dialog v-model="selectProductDialogVisible" title="从商品库选择" width="700px">
      <el-table :data="productLibrary" @selection-change="(val) => selectedProductIds = val.map(p => p._id)">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="商品名称" />
        <el-table-column label="分类" width="100">
          <template #default="{ row }">
            {{ row.categoryName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.specs?.[0]?.price || 0 }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="selectProductDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addSelectedProducts">添加选中 ({{ selectedProductIds.length }})</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.flash-sale {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}
.page-title {
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}
.sale-card {
  max-width: 900px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
