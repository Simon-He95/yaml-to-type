import { FetchingJSONSchemaStore, InputData, JSONSchemaInput, quicktype } from 'quicktype-core'

async function quicktypeJSONSchema(targetLanguage: string, typeName: string, jsonSchemaString: string) {
  const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore())

  // Add the JSON Schema source
  await schemaInput.addSource({ name: typeName, schema: jsonSchemaString })

  const inputData = new InputData()
  inputData.addInput(schemaInput)

  return await quicktype({
    inputData,
    lang: targetLanguage,
    rendererOptions: {
      'just-types': 'true',
      'nice-property-names': 'true',
      'explicit-unions': 'true',
      'runtime-typecheck': 'false',
      'no-emit-top-level-description': 'true',
    },
  })
}

export async function getType(typeName: string, json: any) {
  const seen = new Set()
  const jsonString = JSON.stringify(json, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return // 跳过循环引用
      }
      seen.add(value)
    }
    return value
  }, 2)
  const { lines } = await quicktypeJSONSchema('TypeScript', typeName, jsonString)
  return lines.join('\n')
}
