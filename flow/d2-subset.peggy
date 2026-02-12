{{
  function flattenMajorChain(chain) {
    const result = [];
    for (let i = 0; i < chain.length - 1; i++) {
      result.push({
        id: chain[i],
        next: chain[i + 1]
      });
    }
    return result;
  }
}}

start
  = lines:line* {
      const majors = [];
      const minors = [];
      
      for (const line of lines) {
        if (line && line.type === 'major') {
          majors.push(...line.connections);
        } else if (line && line.type === 'minor') {
          minors.push(line.connection);
        }
      }
      
      return { majors, minors };
    }

line
  = majorLine
  / minorLine
  / newline { return null; }
  / ignoredLine

// Major connection line: starts with # major
majorLine
  = _ "#" _ "major" _ newline _ chain:majorChain [^\n]* newline? {
      return {
        type: 'major',
        connections: flattenMajorChain(chain)
      };
    }

// Major connection chain: a -> b -> c -> d
majorChain
  = first:identifier _ "->" _ rest:majorChainRest {
      return [first, ...rest];
    }

majorChainRest
  = id:identifier _ "->" _ rest:majorChainRest {
      return [id, ...rest];
    }
  / id:identifier {
      return [id];
    }

// Minor connection lines: 3 types
// 1. subscribe: $state.event -> algorithm
// 2. pull: &state.readMethod -> algorithm
// 3. push: algorithm -> @state.writeMethod

minorLine
  = subscribeLine
  / pullLine
  / pushLine

// Subscribe: $state.event -> algorithm
subscribeLine
  = _ "$" state:identifier "." event:identifier _ "->" _ algo:identifier [^\n]* newline? {
      return {
        type: 'minor',
        connection: {
          type: 'subscribe',
          state: state,
          event: event,
          algorithm: algo
        }
      };
    }

// Pull: &state.readMethod -> algorithm
pullLine
  = _ "&" state:identifier "." method:identifier _ "->" _ algo:identifier [^\n]* newline? {
      return {
        type: 'minor',
        connection: {
          type: 'pull',
          state: state,
          method: method,
          algorithm: algo
        }
      };
    }

// Push: algorithm -> @state.writeMethod
pushLine
  = _ algo:identifier _ "->" _ "@" state:identifier "." method:identifier [^\n]* newline? {
      return {
        type: 'minor',
        connection: {
          type: 'push',
          algorithm: algo,
          state: state,
          method: method
        }
      };
    }

// Identifier
identifier
  = chars:[a-zA-Z0-9_]+ {
      return chars.join('');
    }

// Ignored line (must consume at least one non-newline character)
ignoredLine
  = [^\n]+ newline? {
      return null;
    }

// Whitespace (excluding newlines)
_ "whitespace"
  = [ \t]*

// Newline
newline
  = "\r\n"
  / "\n"
  / "\r"
