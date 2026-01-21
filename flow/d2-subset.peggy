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

// Minor connection line: without # major prefix
minorLine
  = _ from:minorIdentifier _ op:connectionOp _ to:minorIdentifier [^\n]* newline? {
      return {
        type: 'minor',
        connection: {
          from: from,
          to: to,
          type: op === '->' ? 'push' : 'pull'
        }
      };
    }

// Connection operator
connectionOp
  = "->"
  / "--"

// Identifier (without $)
identifier
  = chars:[a-zA-Z0-9]+ {
      return chars.join('');
    }

// Minor identifier (can include $)
minorIdentifier
  = "$" chars:[a-zA-Z0-9]+ {
      return '$' + chars.join('');
    }
  / identifier

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
