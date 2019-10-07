[![Build Status](https://travis-ci.org/marcellobarile/nutrifacts.js.svg?branch=master)](https://travis-ci.org/marcellobarile/nutrifacts.js)

# Nutrifacts.js
#### A library to calculate nutrition facts, smartly. No third party services or remote DBs involved.
#

Nutrifacts.js is a library to extract and calculate nutrition facts, on several levels of detail; the library is capable of processing natural language strings and retrieving information using precise inputs (IDs or labels).

Quick example: https://repl.it/@MarcelloBarile/Nutrifactsjs

___
# API
##### Returns the list of nutrients and properties from a given list of ingredients.
_@param ingredients_ -- The list of ingredients. Supports NLP queries (recipeStr) or precise values (label & quantity).
**getNutrientsInRecipe**(ingredients: IInputIngredient[])

##### Returns the best matching food for a given textual query.
_@param query_ -- The query to match.
**getFoodByQuery**(query: string, injectNutrients: boolean)

##### Returns a list of nutrients that matches the given query.
_@param query_ -- The nutrients query to match.
**getNutrientsByQuery**(query: string)

##### Returns the food entity from a given ID.
_@param id_ -- The food ID.
**getFoodById**(id: string)

##### Returns a list of foods that contains the given ingredients' IDs.
_@param ingredientsIds_ -- The list of ingredients' IDs to match.
_@param operator_ -- The logic operator to be applied when matching the ingredients.
**getFoodsByIngredients**(ingredientsIds: number[], operator: LOGIC_OPERATOR)

##### Returns a list of foods that have properties which match the given query string.
_@param query_ -- The properties query to match.
**getFoodsByProperties**(query: string)

___
### Installation

```sh
$ npm install nutrifacts
```
or
```sh
$ yarn add nutrifacts
```

___
### Development

See [CONTRIBUTING.md](CONTRIBUTING.md)

___
### Todos

See [TODOs.md](TODOs.md)

___
### Changelog

See [CHANGELOG.md](CHANGELOG.md)

___
License
----

UNLICENSED
