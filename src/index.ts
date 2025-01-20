import fs from 'node:fs'
import { stringify } from 'flatted'
import { parse } from 'yaml'
import { getType } from './type'

export function parserYaml(yamlString: string): any {
  const jsYaml = parse(yamlString)
  return jsYaml
}

const currentMap = new Map()

export async function jsYamlToType(jsYaml: any) {
  const { paths } = jsYaml
  const result: any = {}
  for (const url in paths) {
    const items = paths[url]
    const temp: any = {}
    result[url] = temp
    for (const method in items) {
      const item = items[method]
      const { description, parameters, requestBody, responses } = item
      if (/get|delete/.test(method)) {
        temp[method] = {
          description,
          parameters: parameters ? await getParameterType(parameters) : '',
          responses: await getResponsesType(responses),
        }
      }
      else {
        temp[method] = {
          description,
          requestBody: await getRequestBodyType(requestBody),
          responses: await getResponsesType(responses),
        }
      }
    }
  }

  function getResponsesType(responses: any) {
    const ref = responses[200].content['application/json']?.schema.$ref
    if (ref) {
      return getType('ResponseType', deepReplaceRef(getCurrent(ref)))
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
    return getType('ParameterType', transformedParameters)
  }

  function getRequestBodyType(requestBody: any) {
    const ref = requestBody.content['application/json']?.schema.$ref
    if (ref) {
      return getType('RequestBodyType', deepReplaceRef(getCurrent(ref)))
    }
    return 'void'
  }

  function getCurrent(ref: string) {
    let current = jsYaml
    if (currentMap.has(ref)) {
      return currentMap.get(ref)
    }
    ref.split('/').forEach((item: string) => {
      if (item === '#')
        return
      current = current[item]
    })
    currentMap.set(ref, current)
    return current
  }

  function deepReplaceRef(current: any, stacks: any[] = []) {
    for (const key in current) {
      if (typeof current[key] === 'object' && stringify(current[key]).includes('$ref')) {
        stacks.push([current[key], current, key])
      }
    }
    while (stacks.length) {
      const [current, parent, parentKey] = stacks.pop()
      for (const key in current) {
        if (key === '$ref') {
          const _current = getCurrent(current[key])
          parent[parentKey] = _current
          // 清空之前的
          // stacks.length = 0
          deepReplaceRef({ ..._current }, stacks)
          break
        }
        else if (typeof current[key] === 'object') {
          stacks.push([current[key], current, key])
        }
      }
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
    // eslint-disable-next-line no-console
    console.log('File has been created')
  })
})
