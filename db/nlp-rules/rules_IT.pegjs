start
  = ingredient_full

ingredient_full
  = amount:amount? (ws+)? container:container? (ws+)? unit:unit? (ws+)? preposition:preposition? (ws+)? ingredient:ingredient? [\n]? {

    var result = {
      amount: amount,
      container: container,
      ingredient: ingredient,
      unit: unit,
    };

    for(var i in result) {
      if(result[i] === null || result[i] === undefined) {
        delete result[i];
      }
    }

    return result;
  }

amount
  = fraction
  / mixed_number
  / word_number
  / float
  / integer
  / few
  / couple

container
  = container_wrapper_start? (ws+)? amount:amount (ws+)? unit:unit (ws+)? container_wrapper_end? {
    return { amount: amount, unit: unit };
  }

container_wrapper_start
  = "(" / "{" / "[" / "<"

container_wrapper_end
  = ")" / "}" / "]" / ">"

ws
  = " "
  / [\t]

preposition
  = "di"i
  / "e"i
  / " e "i
  / " - "i
  / "-"i
  / ", "i
  / ","i

article
  = "un"i / "una"i / "del"i / "dei"i / "delle"i / "degli"i

space
  = " "

ingredient
  = phrase

phrase
  = $(.+)

punctuation
  = [,]

word
  = letters:letter+ { return letters.join(""); }

float
  = $(integer? [.] integer)

mixed_number
  = $(integer preposition fraction)
  / $(integer space fraction)
  / $(integer unit fraction)

word_number
  = "uno"i
  / "una"i
  / "un"i
  / "due"i
  / "tre"i
  / "quattro"i
  / "cinque"i
  / "sei"i
  / "sette"i
  / "otto"i
  / "nove"i
  / "dieci"i
  / "dodici"i
  / "tredici"i

couple
  = $(article? " "? "coppia"i)
  / $(article? " "? "paio"i)

few
  = $(article? " "? "poco"i)
  / $(article? " "? "po"i)
  / $(article? " "? "po'"i)

fraction
  = $(integer [/] integer)

integer
  = digits:[0-9]+ { return digits.join(""); }

letter
  = [a-zA-Z]

unit
  = $(generic !letter)
  / $(metric_unit !letter)
  / $(imprecise_unit !letter)

generic
  = tazza
  / cucchiaino
  / cucchiaio
  / bicchiere

tazza
  = "tazze"i
  / "tazza"i

cucchiaino
  = "cucchiaini"i
  / "cucchiaino"i
  
cucchiaio
  = "cucchiaio"i
  / "cucchiai"i
  
bicchiere
  = "bicchieri"i
  / "bicchiere"i

metric_unit
  = grammo
  / kilogrammo
  / litro
  / milligrammo
  / millilitro

grammo
  = "grammi"i
  / "grammo"i
  / "gr."i
  / "gr"i
  / "g."i
  / "g"i

kilogrammo
  = "kilogrammi"i
  / "kilogrammo"i
  / "kg."i
  / "kg"i
  / "k."i
  / "k"i

litro
  = "litri"i
  / "litro"i
  / "lt."i
  / "lt"i
  / "l."i
  / "l"i

milligrammo
  = "milligrammi"i
  / "milligrammo"i
  / "mg."i
  / "mg"i

millilitro
  = "millilitri"i
  / "millilitro"i
  / "ml."i
  / "ml"i

imprecise_unit
  = dash
  / pugno
  / pizzico

dash
  = "qb"i
  / "q.b."i
  / "q.b"i
  / "qb."i

pugno
  = "pugni"i
  / "pugno"i

pizzico
  = "pizzichi"i
  / "pizzico"i