import fs from 'node:fs'
import { parse } from 'yaml'
import { getType } from './type'

export function parserYaml(yamlString: string): any {
  const jsYaml = parse(yamlString)
  return jsYaml
}

export async function jsYamlToType(jsYaml: any) {
  const { paths } = jsYaml
  const result: any = {}
  for (const url in paths) {
    const items = paths[url]
    const temp: any = {}
    result[url] = temp
    for (const method in items) {
      const item = items[method]
      const { description, requestBody, responses } = item
      if (/get|delete/.test(method)) {
        temp[method] = {
          description,
          // parameters: await getParameterType(parameters),
          // responses: await getResponsesType(responses)
        }
      }
      else {
        temp[method] = {
          description,
          // requestBody: await getRequestBodyType(requestBody),
          responses: await getResponsesType(responses),
        }
      }
    }
  }

  function getResponsesType(responses: any) {
    const ref = responses[200].content['application/json']?.schema.$ref
    if (ref) {
      return getType('ResponseType', JSON.stringify(deepReplaceRef(getCurrent(ref))))
    }
    return 'void'
  }

  function getParameterType(parameters: any) {
    const transformedParameters = parameters.reduce((r: any, param: any) => {
      const { name, schema } = param
      delete param.schema
      switch (schema.type) {
        case 'array': {
          r[name] = { ...param, type: 'array' }
          break
        }
        case 'integer': {
          r[name] = { ...param, type: 'number' }
          break
        }
        case 'string': {
          r[name] = { ...param, type: 'string' }
          break
        }
        case 'object': {
          r[name] = { ...param, type: 'object' }
          break
        }
        case 'boolean': {
          r[name] = { ...param, type: 'boolean' }
          break
        }
      }
      return r
    }, {})
    return getType('ParameterType', JSON.stringify(transformedParameters))
  }

  function getRequestBodyType(requestBody: any) {
    const ref = requestBody.content['application/json']?.schema.$ref
    if (ref) {
      return getType('RequestBodyType', JSON.stringify(deepReplaceRef(getCurrent(ref))))
    }
    return 'void'
  }

  function getCurrent(ref: string) {
    let current = jsYaml
    ref.split('/').forEach((item: string) => {
      if (item === '#')
        return
      current = current[item]
    })
    return current
  }

  function deepReplaceRef(current: any, parent?: any, parentKey?: string) {
    for (const key in current) {
      if (key === '$ref') {
        const ref = current[key]
        parent[parentKey!] = getCurrent(ref)
        return deepReplaceRef(parent[parentKey!])
      }
      else if (typeof current[key] === 'object') {
        deepReplaceRef(current[key], current, key)
      }
      continue
    }
    return current
  }
  return result
}

const data = fs.readFileSync('./src/test.yaml', 'utf8')

jsYamlToType(parserYaml(data)).then((d) => {
  fs.writeFile('./src/test.json', JSON.stringify(d, null, 2), (err) => {
    if (err) {
      console.error(err)
      return
    }
    console.log('File has been created')
  })
})
