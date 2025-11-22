/**
 * Smart shop matching utility
 * Matches shops based on device brand, model, and repair component
 * Now includes vector-based semantic matching for better accuracy
 */

import { calculateSemanticSimilarity, buildSemanticQuery } from "./vector-matching"

export interface DiagnosisMatch {
  device_brand?: string
  device_type?: string
  device_category?: string // Device category (e.g., "smartphone", "tablet", "laptop")
  repair_component?: string
  repair_keywords?: string[]
}

/**
 * Normalize text for matching (lowercase, remove special chars, handle variations)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

/**
 * Extract brand from device type
 */
function extractBrand(deviceType: string): string {
  const normalized = normalizeText(deviceType)
  
  // Common brand patterns - order matters (more specific first)
  const brandPatterns: Array<[string, string]> = [
    ['one plus', 'oneplus'],
    ['oneplus', 'oneplus'],
    ['hewlett packard', 'hp'],
    ['macbook', 'apple'],
    ['imac', 'apple'],
    ['ipad', 'apple'],
    ['ipod', 'apple'],
    ['iphone', 'apple'],
    ['galaxy', 'samsung'],
    ['thinkpad', 'lenovo'],
    ['alienware', 'dell'],
    ['rog', 'asus'],
    ['xperia', 'sony'],
    ['pixel', 'google'],
    ['redmi', 'xiaomi'],
    ['poco', 'xiaomi'],
    ['surface', 'microsoft'],
    ['apple', 'apple'],
    ['samsung', 'samsung'],
    ['oneplus', 'oneplus'],
    ['google', 'google'],
    ['xiaomi', 'xiaomi'],
    ['oppo', 'oppo'],
    ['realme', 'realme'],
    ['vivo', 'vivo'],
    ['huawei', 'huawei'],
    ['honor', 'honor'],
    ['sony', 'sony'],
    ['lg', 'lg'],
    ['motorola', 'motorola'],
    ['moto', 'motorola'],
    ['nokia', 'nokia'],
    ['dell', 'dell'],
    ['hp', 'hp'],
    ['lenovo', 'lenovo'],
    ['asus', 'asus'],
    ['acer', 'acer'],
    ['msi', 'msi'],
    ['razer', 'razer'],
    ['microsoft', 'microsoft'],
  ]
  
  for (const [pattern, brandName] of brandPatterns) {
    if (normalized.includes(pattern)) {
      return brandName
    }
  }
  
  // If no brand found, try to extract first word
  const words = normalized.split(/\s+/)
  return words[0] || ''
}

/**
 * Get repair component variations
 */
function getRepairComponentVariations(component: string): string[] {
  const normalized = normalizeText(component)
  const variations = [normalized]
  
  // Common variations mapping
  const variationMap: Record<string, string[]> = {
    'screen': ['display', 'lcd', 'oled', 'amoled', 'touchscreen', 'touch screen'],
    'display': ['screen', 'lcd', 'oled', 'amoled', 'touchscreen'],
    'battery': ['power', 'charging', 'cell'],
    'camera': ['lens', 'photo', 'picture'],
    'charging port': ['usb port', 'charging', 'port', 'connector'],
    'speaker': ['audio', 'sound'],
    'microphone': ['mic', 'audio input'],
    'motherboard': ['mainboard', 'logic board', 'pcb'],
    'keyboard': ['keys', 'typing'],
    'trackpad': ['touchpad', 'mouse pad'],
  }
  
  // Add variations
  for (const [key, values] of Object.entries(variationMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      variations.push(...values)
    }
  }
  
  return [...new Set(variations)]
}

/**
 * Check if shop expertise matches diagnosis
 * Now includes vector-based semantic matching for better accuracy
 */
export async function shopMatchesDiagnosis(
  shopExpertise: string[],
  diagnosis: DiagnosisMatch,
  services?: Array<{ name: string; description?: string | null; type?: string | null }>
): Promise<{ matches: boolean; score: number; matchedTerms: string[]; semanticScore?: number }> {
  const matchedTerms: string[] = []
  let score = 0
  
  // Normalize expertise
  const normalizedExpertise = (shopExpertise || []).map(exp => normalizeText(exp))
  
  // Normalize services (only active services)
  const normalizedServices = (services || [])
    .filter(s => s.name) // Only services with names
    .map(s => ({
      name: normalizeText(s.name),
      description: s.description ? normalizeText(s.description) : '',
      type: s.type ? normalizeText(s.type) : '',
      fullText: `${normalizeText(s.name)} ${s.description ? normalizeText(s.description) : ''} ${s.type ? normalizeText(s.type) : ''}`.trim()
    }))
  
  // If no expertise and no services, no match
  if (normalizedExpertise.length === 0 && normalizedServices.length === 0) {
    return { matches: false, score: 0, matchedTerms: [] }
  }
  
  // Extract brand from device_type if device_brand not provided
  const brand = diagnosis.device_brand 
    ? normalizeText(diagnosis.device_brand)
    : diagnosis.device_type 
      ? extractBrand(diagnosis.device_type)
      : ''
  
  // Check device category match (HIGHEST priority) - this is critical for matching
  // For example: "Samsung A35" should match shops with "smartphone", "mobile phone", "phone" expertise
  if (diagnosis.device_category) {
    const category = normalizeText(diagnosis.device_category)
    
    // Map categories to common shop expertise terms
    const categoryMappings: Record<string, string[]> = {
      'smartphone': ['smartphone', 'mobile phone', 'phone', 'cell phone', 'android phone', 'iphone', 'iphone repair', 'mobile', 'smartphone repair'],
      'mobile phone': ['smartphone', 'mobile phone', 'phone', 'cell phone', 'android phone', 'iphone', 'iphone repair', 'mobile', 'smartphone repair'],
      'phone': ['smartphone', 'mobile phone', 'phone', 'cell phone', 'android phone', 'iphone', 'iphone repair', 'mobile', 'smartphone repair'],
      'tablet': ['tablet', 'ipad', 'ipad repair', 'tablet repair', 'android tablet'],
      'ipad': ['tablet', 'ipad', 'ipad repair', 'tablet repair'],
      'laptop': ['laptop', 'notebook', 'macbook', 'laptop repair', 'notebook repair', 'computer repair'],
      'notebook': ['laptop', 'notebook', 'macbook', 'laptop repair', 'notebook repair', 'computer repair'],
      'desktop': ['desktop', 'pc', 'computer', 'desktop repair', 'pc repair', 'computer repair'],
      'pc': ['desktop', 'pc', 'computer', 'desktop repair', 'pc repair', 'computer repair'],
      'smartwatch': ['smartwatch', 'watch', 'apple watch', 'smartwatch repair', 'watch repair'],
      'watch': ['smartwatch', 'watch', 'apple watch', 'smartwatch repair', 'watch repair'],
      'gaming console': ['gaming console', 'playstation', 'xbox', 'nintendo', 'console repair', 'gaming'],
      'headphones': ['headphones', 'earbuds', 'earphones', 'audio repair', 'headphone repair'],
      'camera': ['camera', 'dslr', 'camera repair', 'photography'],
    }
    
    const categoryTerms = categoryMappings[category] || [category]
    
    // Check expertise - be very lenient with matching
    const categoryMatchExpertise = normalizedExpertise.some(exp => {
      const expLower = normalizeText(exp)
      // Direct match
      if (categoryTerms.some(term => {
        const termNorm = normalizeText(term)
        return expLower === termNorm || 
          expLower.includes(termNorm) || 
          termNorm.includes(expLower) ||
          expLower.startsWith(termNorm) ||
          termNorm.startsWith(expLower) ||
          expLower.split(/\s+/).includes(termNorm) ||
          termNorm.split(/\s+/).includes(expLower) ||
          expLower.split(/\s+/).some(word => termNorm.split(/\s+/).includes(word)) ||
          termNorm.split(/\s+/).some(word => expLower.split(/\s+/).includes(word))
      })) {
        return true
      }
      // Also check if category itself matches expertise directly
      return expLower.includes(category) || category.includes(expLower)
    })
    
    // Check services
    const categoryMatchServices = normalizedServices.some(service => {
      return categoryTerms.some(term => {
        const termNorm = normalizeText(term)
        return service.fullText.includes(termNorm) ||
          service.name.includes(termNorm) ||
          service.description.includes(termNorm) ||
          service.type.includes(termNorm) ||
          termNorm.includes(service.name) ||
          termNorm.includes(service.description)
      })
    })
    
    if (categoryMatchExpertise || categoryMatchServices) {
      score += 4 // Higher priority than brand match
      matchedTerms.push(diagnosis.device_category)
    }
  }
  
  // Check brand match (high priority) - check both expertise and services
  if (brand) {
    // Check expertise
    const brandMatchExpertise = normalizedExpertise.some(exp => {
      const expLower = normalizeText(exp)
      return expLower.includes(brand) || brand.includes(expLower) ||
        expLower.startsWith(brand) || brand.startsWith(expLower)
    })
    
    // Check services
    const brandMatchServices = normalizedServices.some(service => {
      return service.fullText.includes(brand) || 
        service.name.includes(brand) ||
        service.type.includes(brand)
    })
    
    if (brandMatchExpertise || brandMatchServices) {
      score += 3
      matchedTerms.push(brand)
    }
  }
  
  // Check device type match (medium-high priority) - check both expertise and services
  if (diagnosis.device_type) {
    const deviceType = normalizeText(diagnosis.device_type)
    
    // Check expertise
    const deviceMatchExpertise = normalizedExpertise.some(exp => {
      const expLower = normalizeText(exp)
      return expLower.includes(deviceType) || 
        deviceType.includes(expLower) ||
        deviceType.startsWith(expLower) ||
        expLower.startsWith(deviceType.split(' ')[0])
    })
    
    // Check services
    const deviceMatchServices = normalizedServices.some(service => {
      return service.fullText.includes(deviceType) ||
        service.name.includes(deviceType) ||
        service.description.includes(deviceType)
    })
    
    if (deviceMatchExpertise || deviceMatchServices) {
      score += 2
      matchedTerms.push(diagnosis.device_type)
    }
  }
  
  // Check repair component match (high priority) - check both expertise and services
  if (diagnosis.repair_component) {
    const componentVariations = [
      ...getRepairComponentVariations(diagnosis.repair_component),
      ...(diagnosis.repair_keywords || []).map(k => normalizeText(k))
    ]
    
    // Check expertise
    const componentMatchExpertise = normalizedExpertise.some(exp => {
      const expLower = normalizeText(exp)
      return componentVariations.some(variation => {
        const variationNorm = normalizeText(variation)
        return expLower.includes(variationNorm) || 
          variationNorm.includes(expLower) ||
          expLower.startsWith(variationNorm) ||
          variationNorm.startsWith(expLower) ||
          expLower.split(/\s+/).includes(variationNorm) ||
          variationNorm.split(/\s+/).includes(expLower)
      })
    })
    
    // Check services - this is very important for matching
    const componentMatchServices = normalizedServices.some(service => {
      return componentVariations.some(variation => {
        const variationNorm = normalizeText(variation)
        // Check service name, description, and type
        return service.name.includes(variationNorm) ||
          variationNorm.includes(service.name) ||
          service.description.includes(variationNorm) ||
          variationNorm.includes(service.description) ||
          service.type.includes(variationNorm) ||
          variationNorm.includes(service.type) ||
          service.fullText.includes(variationNorm) ||
          variationNorm.includes(service.fullText) ||
          // Check word boundaries
          service.name.split(/\s+/).includes(variationNorm) ||
          service.description.split(/\s+/).includes(variationNorm) ||
          service.type.split(/\s+/).includes(variationNorm)
      })
    })
    
    if (componentMatchExpertise || componentMatchServices) {
      score += 3
      matchedTerms.push(diagnosis.repair_component)
    }
  }
  
  // Check repair keywords if provided - check both expertise and services
  if (diagnosis.repair_keywords) {
    diagnosis.repair_keywords.forEach(keyword => {
      const keywordNorm = normalizeText(keyword)
      
      // Check expertise
      const keywordMatchExpertise = normalizedExpertise.some(exp => {
        const expLower = normalizeText(exp)
        return expLower.includes(keywordNorm) || keywordNorm.includes(expLower)
      })
      
      // Check services
      const keywordMatchServices = normalizedServices.some(service => {
        return service.fullText.includes(keywordNorm) ||
          service.name.includes(keywordNorm) ||
          service.description.includes(keywordNorm) ||
          service.type.includes(keywordNorm)
      })
      
      if (keywordMatchExpertise || keywordMatchServices) {
        score += 1
        matchedTerms.push(keyword)
      }
    })
  }
  
  // Calculate semantic similarity as additional matching signal
  let semanticScore = 0
  try {
    const semanticQuery = buildSemanticQuery(diagnosis)
    if (semanticQuery.trim()) {
      semanticScore = await calculateSemanticSimilarity(semanticQuery, shopExpertise, services)
      // Add semantic score to total (weighted)
      if (semanticScore > 0.7) {
        score += 3 // High semantic similarity
      } else if (semanticScore > 0.5) {
        score += 2 // Medium semantic similarity
      } else if (semanticScore > 0.3) {
        score += 1 // Low semantic similarity
      }
    }
  } catch (error) {
    // If semantic matching fails, continue with keyword-based matching
    console.warn("Semantic matching failed, using keyword-based matching:", error)
  }
  
  // Match if:
  // 1. Score >= 2 (keyword-based matching)
  // 2. Semantic similarity >= 0.5 (strong semantic match)
  // 3. Category match alone (score 4) should always match
  const matches = score >= 2 || semanticScore >= 0.5 || (diagnosis.device_category && score >= 1)
  
  return { matches, score, matchedTerms: [...new Set(matchedTerms)], semanticScore }
}

/**
 * Sort shops by match relevance
 */
export async function sortShopsByRelevance(
  shops: any[],
  diagnosis: DiagnosisMatch
): Promise<any[]> {
  const shopsWithMatches = await Promise.all(
    shops.map(async (shop) => {
      const services = (shop.shop_products || []).filter((p: any) => p.category === "service" && p.in_stock !== false)
      return {
        ...shop,
        matchResult: await shopMatchesDiagnosis(shop.expertise || [], diagnosis, services),
      }
    })
  )
  
  return shopsWithMatches.sort((a, b) => {
    // First sort by semantic score if available (higher is better)
    if (a.matchResult.semanticScore !== undefined && b.matchResult.semanticScore !== undefined) {
      if (b.matchResult.semanticScore !== a.matchResult.semanticScore) {
        return b.matchResult.semanticScore - a.matchResult.semanticScore
      }
    }
    // Then by match score (higher is better)
    if (b.matchResult.score !== a.matchResult.score) {
      return b.matchResult.score - a.matchResult.score
    }
    // Then by rating (higher is better)
    if (b.rating !== a.rating) {
      return (b.rating || 0) - (a.rating || 0)
    }
    // Then by distance if available
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance
    }
    return 0
  })
}

