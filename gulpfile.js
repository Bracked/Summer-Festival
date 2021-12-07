const {src, dest, parallel, series, watch} = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const notify = require('gulp-notify');
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const fileinclude = require('gulp-file-include');
const svgSprite = require('gulp-svg-sprite');
const ttf2woff2 = require('gulp-ttf2woff2');
const fs = require('fs');
const del = require('del');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const uglify = require('gulp-uglify-es').default;
const group_media = require("gulp-group-css-media-queries");

// const imagemin = require("gulp-imagemin");




const scripts = ()=> {
  return src('./src/assets/js/main.js')
  .pipe(webpackStream({
    output: {
      filename:'main.js'
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                  "@babel/preset-env"
              ]
          }
          }
        }
      ]
    }
  }))
  .on('error', function (err) {
    console.error('WEBPACK ERROR', err);
    this.emit('end'); // Don't stop the rest of the task
  })
  .pipe(sourcemaps.init())
  .pipe(uglify().on("error",notify.onError()))
  .pipe(sourcemaps.write('.'))
  .pipe(dest('./dist/assets/js/'))
  .pipe(browserSync.stream())

  
}

const checkWeight = (fontname) => {
  let weight = 400;
  switch (true) {
    case /Thin/.test(fontname):
      weight = 100;
      break;
    case /ExtraLight/.test(fontname):
      weight = 200;
      break;
    case /Light/.test(fontname):
      weight = 300;
      break;
    case /Regular/.test(fontname):
      weight = 400;
      break;
    case /Medium/.test(fontname):
      weight = 500;
      break;
    case /SemiBold/.test(fontname):
      weight = 600;
      break;
    case /Semi/.test(fontname):
      weight = 600;
      break;
    case /Bold/.test(fontname):
      weight = 700;
      break;
    case /ExtraBold/.test(fontname):
      weight = 800;
      break;
    case /Heavy/.test(fontname):
      weight = 700;
      break;
    case /Black/.test(fontname):
      weight = 900;
      break;
    default:
      weight = 400;
  }
  return weight;
}

const clean = () => {
  return del('./dist/*')
}
const fonts = () => {
  return src('./src/assets/fonts/**.ttf')
    .pipe(ttf2woff2())
    .pipe(dest('./dist/assets/fonts/'))
    .pipe(browserSync.stream())

}

const cb = () => {}

let srcFonts = 'src/assets/sass/fonts.scss'; /*Подивитись якщо не буде працювати то додати "./"*/
let distFonts = 'dist/assets/fonts/';

const fontsStyle = (done) => {
  let file_content = fs.readFileSync(srcFonts);

  fs.writeFile(srcFonts, '', cb);
  fs.readdir(distFonts, function (err, items) {
    if (items) {
      let c_fontname;
      for (var i = 0; i < items.length; i++) {
        let fontname = items[i].split('.');
        fontname = fontname[0];
        let font = fontname.split('-')[0];
        let weight = checkWeight(fontname);

        if (c_fontname != fontname) {
          fs.appendFile(srcFonts, '@include font-face("' + font + '", "' + fontname + '", ' + weight + ');\r\n', cb);
        }
        c_fontname = fontname;
      }
    }
  })

  done();
}

const resources = () => {
  return src('./src/assets/resources')
    .pipe(dest('./dist/'))
}

const svgSprites = ()=> {
  return src('./src/assets/img/**.svg')
    // .pipe(svgSprite({
    //   mode:{
    //     stack:{
    //       sprite:"../sprite.svg"
    //     }
    //   }
    // }))
    .pipe(dest('./dist/assets/img/'))
}

const styles = () => {
    return src("./src/assets/sass/main.scss")
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(group_media())
    .pipe(dest("./dist/assets/css/"))
    .pipe(rename({suffix:'.min'}))
    .pipe(autoprefixer({
        cascade:false,
    }))
    .pipe(cleanCSS({
        level:2
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest("./dist/assets/css/"))
    .pipe(browserSync.stream())
}

const htmlinclude = () => {
  return src(['./src/index.html'])
  .pipe(fileinclude({
    prefix:'@',
    basepath:'@file'
  }))
  .pipe(dest('./dist'))
  .pipe(browserSync.stream())
}

const imgToApp = () => {
  return src(['./src/assets/img/**.jpg','./src/assets/img/**.png','./src/assets/img/**.jpeg'])
  .pipe(dest('./dist/assets/img/'))
}

const watchfiles = () => {
    browserSync.init({
        server: {
            baseDir:"./dist"
        }
    });
    watch('./src/assets/sass/**/*.scss',styles)
    watch('./src/*.html',htmlinclude)
    watch('./src/assets/img/**/*.jpg',imgToApp)
    watch('./src/assets/img/**/*.jpeg',imgToApp)
    watch('./src/assets/img/**/*.png',imgToApp)
    watch('./src/assets/img/**/*.svg',svgSprites)
    watch('./src/assets/resources/**',resources)
    watch('./src/assets/fonts/**.ttf',fonts)
    watch('./src/assets/fonts/**.ttf',fontsStyle)
    watch('./src/assets/js/**/*.js',scripts)

}
 
exports.styles = styles;
exports.watchfiles = watchfiles;
exports.fileinclude = htmlinclude;

exports.default = series(clean,parallel(htmlinclude,scripts,fonts,imgToApp,resources,svgSprites),fontsStyle,styles,watchfiles);

// const scriptsBuild = ()=> {
//   return src('./src/assets/js/main.js')
//   .pipe(webpackStream({
//     output: {
//       filename:'main.js'
//     },
//     module: {
//       rules: [
//         {
//           test: /\.m?js$/,
//           exclude: /node_modules/,
//           use: {
//             loader: 'babel-loader',
//             options: {
//               presets: [
//                   "@babel/preset-env"
//               ]
//           }
//           }
//         }
//       ]
//     }
//   }))
//   .on('error', function (err) {
//     console.error('WEBPACK ERROR', err);
//     this.emit('end'); // Don't stop the rest of the task
//   })
//   .pipe(uglify().on("error",notify.onError()))
//   .pipe(dest('./dist/assets/js/'))

  
// }


// const stylesBuild = () => {
//   return src("./src/assets/sass/main.scss")
//   .pipe(sass().on('error', sass.logError))
//   .pipe(dest("./dist/assets/css/"))
//   .pipe(rename({suffix:'.min'}))
//   .pipe(autoprefixer({
//       cascade:false,
//   }))
//   .pipe(cleanCSS({
//       level:2
//   }))
//   .pipe(dest("./dist/assets/css/"))
// }

// const imgToAppBuild = () => {
//   return src(['./src/assets/img/**.jpg','./src/assets/img/**.png','./src/assets/img/**.jpeg'])
//   .pipe(imagemin())
//   .pipe(dest('./dist/assets/img/'))
// }

// exports.build = series(clean,parallel(htmlinclude,scripts,fonts,imgToApp,resources,svgSprites),fontsStyle,stylesBuild,watchfiles);
