#Bundle.js

import * as THREE from './../module/build/three.module.js'
import {SkeletonUtils} from './../module/jsm/utils/SkeletonUtils.js'
import {FBXLoader} from './../module/jsm/loaders/FBXLoader.js'
import Stats from './../module/jsm/libs/stats.module.js'
import {Terrain} from './mod/Terrain.js'
import {FirstPersonControls} from './mod/FirstPersonControls.js'
import {gpuInfo} from './mod/gpuInfo.js'

scene=null
materials=null
parameters=null
canvas=null
renderer=null
camera=null
terrain=null
cursor=null
FPC=null
socket=null
stats=null
worker=null
server=null
playerObject=null
inv_bar=null

getNick=->
	if document.location.search is ""
		return false
	return document.location.search.substring(1,document.location.search.length)
class AssetLoader
	constructor: (options)->
		@assets={}
	load: (assets,callback) ->
		_this=@
		textureLoader = new THREE.TextureLoader
		fbxl = new FBXLoader()
		assetsNumber=0
		assetsLoaded=0
		Object.keys(assets).forEach (p)->
			assetsNumber++
		Object.keys(assets).forEach (p)->
			type=assets[p].type
			path=assets[p].path
			dynamic=assets[p].dynamic;
			if dynamic
				path+="?"+THREE.MathUtils.generateUUID()
			if type is "texture"
				textureLoader.load path,(texture)->
					_this.assets[p]=texture
					assetsLoaded++;
					if assetsLoaded is assetsNumber
						callback()
			if type is "text"
				$.get path,(data)->
					_this.assets[p]=data
					assetsLoaded++;
					if assetsLoaded is assetsNumber
						callback()
			if type is "image"
				img = new Image
				img.onload= ->
					_this.assets[p]=img
					assetsLoaded++;
					if assetsLoaded is assetsNumber
						callback()
				img.src=path
			if type is "fbx"
				fbxl.load path,(fbx)->
					_this.assets[p]=fbx
					assetsLoaded++;
					if assetsLoaded is assetsNumber
						callback()
		return this;
	get: (assetName)->
		return @assets[assetName]
class InventoryBar
	constructor: (options)->
		@boxSize=options.boxSize
		@div=options.div
		@padding=options.padding
		@boxes=9
		@activeBox=1
		document.querySelector(@div).style="position:fixed;bottom:3px;left:50%;width:#{(@boxSize+2)*@boxes}px;margin-left:-#{@boxSize*@boxes/2}px;height:#{@boxSize}px;"
	setBox: (number,imageSrc)->
		if imageSrc is null
			imageSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
		document.querySelector(".inv_box_#{number}").src=imageSrc
		return
	setFocus: (number,state)->
		if state
			document.querySelector(".inv_box_#{number}").style.background="rgba(0,0,0,0.7)"
			document.querySelector(".inv_box_#{number}").style.border="1px solid black"
		else
			document.querySelector(".inv_box_#{number}").style.background="rgba(54,54,54,0.5)"
			document.querySelector(".inv_box_#{number}").style.border="1px solid #363636"
		return
	setFocusOnly: (number)->
		for i in [1..@boxes]
			@setFocus i, i is number
		@activeBox=number
		return @
	moveBoxMinus: ->
		if @activeBox + 1 > @boxes
			@setFocusOnly 1
		else
			@setFocusOnly @activeBox + 1
		return
	moveBoxPlus: ->
		if @activeBox - 1 is 0
			@setFocusOnly @boxes
		else
			@setFocusOnly @activeBox - 1
	directBoxChange: (event)->
		code = event.keyCode
		if code >= 49 and code < 49 + @boxes
			@setFocusOnly code - 48
	setBoxes: (images)->
		for i in [0..images.length-1]
			@setBox i+1,images[i]
		return @
	listen: ->
		_this=@
		$(window).on 'wheel', (event) ->
			if event.originalEvent.deltaY < 0
				_this.moveBoxPlus()
			else
				_this.moveBoxMinus()
		$(document).keydown (z) ->
			_this.directBoxChange(z)
		return @
class TextureAtlasCreator
	constructor: (options)->
		@textureX=options.textureX
		@textureMapping=options.textureMapping
		@size=36
		@willSize=27
	gen: (tick)->
		multi={}
		for i of @textureMapping
			if i.includes "@"
				xd=@decodeName i
				if multi[xd.pref] is undefined
					multi[xd.pref]=xd
				else
					multi[xd.pref].x=Math.max multi[xd.pref].x,xd.x
					multi[xd.pref].y=Math.max multi[xd.pref].y,xd.y
		canvasx = document.createElement 'canvas'
		ctx=canvasx.getContext "2d"
		canvasx.width=@willSize*16
		canvasx.height=@willSize*16
		toxelX=1
		toxelY=1
		for i of @textureMapping	
			if i.includes "@"
				xd=@decodeName i
				if multi[xd.pref].loaded is undefined
					multi[xd.pref].loaded=true
					lol=@getToxelForTick tick,multi[xd.pref].x+1,multi[xd.pref].y+1
					texmap=@textureMapping["#{xd.pref}@#{lol.col}@#{lol.row}"]
					ctx.drawImage @textureX,(texmap.x-1)*16,(texmap.y-1)*16,16,16,(toxelX-1)*16,(toxelY-1)*16,16,16
					toxelX++
					if toxelX>@willSize
						toxelX=1
						toxelY++
			else
				ctx.drawImage @textureX,(@textureMapping[i].x-1)*16,(@textureMapping[i].y-1)*16,16,16,(toxelX-1)*16,(toxelY-1)*16,16,16
				toxelX++
				if toxelX>@willSize
					toxelX=1
					toxelY++
		return canvasx
	decodeName: (i)->
		m=null
		for j in [0..i.length-1]
			if i[j] is "@"
				m=j
				break
		pref=i.substr 0,m
		sub=i.substr m,i.length
		m2=null
		for j in [0..sub.length-1]
			if sub[j] is "@"
				m2=j
		x=parseInt sub.substr(1,m2-1)
		y=parseInt sub.substr(m2+1,sub.length)
		return {pref,x,y}
	getToxelForTick: (tick,w,h)->
		tick=tick%(w*h)+1
		#option1
		col=(tick-1)%w
		row=Math.ceil(tick/w)-1
		#option2
		col=Math.ceil(tick/h)-1
		row=(tick-1)%h;
		return {row,col}  
class Server
	constructor:(options)->
		@terrain=options.terrain
		@socket=io.connect options.ip
		@socket.on "connect",()->
			console.log "Połączono z serverem!"
			return
		@socket.on "blockUpdate",(block)->
			terrain.setVoxel block...
			return
	onChunkUpdate: (f)->
		@socket.on "chunkUpdate", (chunk)->
			f(chunk)
class TerrainWorker
	constructor: (options)->
		@worker=new Worker "workers/terrain.js", {type:'module'}
		@worker.onmessage=(message)->
			terrain.updateCell message.data
			# console.warn "RECIEVED CELL:",message.data.info
		@worker.postMessage {
			type:'init'
			data:{
				models:{
					anvil:{
						al.get("anvil").children[0].geometry.attributes...
					}
				}
				blocks: al.get "blocks"
				blocksMapping: al.get "blocksMapping"
				toxelSize: 27
				cellSize: 16
			}
		}
	setVoxel: (voxelX,voxelY,voxelZ,value)->
		@worker.postMessage {
			type:"setVoxel"
			data:[voxelX,voxelY,voxelZ,value]
		}
	genCellGeo: (cellX,cellY,cellZ)->
		cellX=parseInt cellX
		cellY=parseInt cellY
		cellZ=parseInt cellZ
		@worker.postMessage {
			type:"genCellGeo"
			data:[cellX,cellY,cellZ]
		}
init = ()->
	#Terrain worker
	worker=new TerrainWorker
	
	#canvas,renderer,camera,lights
	(()->
		canvas=document.querySelector '#c'
		renderer=new THREE.WebGLRenderer {
			canvas
			PixelRatio:window.devicePixelRatio
		}
		scene=new THREE.Scene
		scene.background=new THREE.Color "lightblue"
		camera = new THREE.PerspectiveCamera 75, 2, 0.1, 64*5
		camera.rotation.order = "YXZ"
		camera.position.set 26, 26, 26
		#Lights
		ambientLight=new THREE.AmbientLight 0xcccccc
		scene.add ambientLight
		directionalLight = new THREE.DirectionalLight 0x333333, 2
		directionalLight.position.set(1, 1, 0.5).normalize()
		scene.add directionalLight 
		gpu=gpuInfo()
		console.warn gpu.renderer
	)()
	
	#Snowflakes
	(()->
		geometry = new THREE.BufferGeometry
		vertices = []
		materials=[]
		sprite1 = al.get "snowflake1" 
		sprite2 = al.get "snowflake2" 
		sprite3 = al.get "snowflake3" 
		sprite4 = al.get "snowflake4" 
		sprite5 = al.get "snowflake5" 
		for i in [0..1000]
			x = Math.random() * 2000 - 1000
			y = Math.random() * 2000 - 1000
			z = Math.random() * 2000 - 1000
			vertices.push x, y, z
		geometry.setAttribute 'position', new THREE.Float32BufferAttribute( vertices, 3 )
		parameters = [
			[[ 1.0, 0.2, 0.5 ], sprite2, 20 ],
			[[ 0.95, 0.1, 0.5 ], sprite3, 15 ],
			[[ 0.90, 0.05, 0.5 ], sprite1, 10 ],
			[[ 0.85, 0, 0.5 ], sprite5, 8 ],
			[[ 0.80, 0, 0.5 ], sprite4, 5 ]
		]
		for i in [0..parameters.length-1]
			color=parameters[ i ][ 0 ]
			sprite = parameters[ i ][ 1 ]
			size = parameters[ i ][ 2 ]
			materials[ i ] = new THREE.PointsMaterial { 
				size: size
				map: sprite
				blending: THREE.AdditiveBlending
				depthTest: false
				transparent: true 
			}
			materials[ i ].color.setHSL( color[ 0 ], color[ 1 ], color[ 2 ] )
			particles = new THREE.Points geometry, materials[ i ]
			particles.rotation.x = Math.random() * 6
			particles.rotation.y = Math.random() * 6
			particles.rotation.z = Math.random() * 6
			scene.add particles
		for i in [0..materials.length-1]
			materials[ i ].map = parameters[ i ][ 1 ]
			materials[ i ].needsUpdate = true
	)()
	
	#Static objects
	(()->
		#Clouds
		clouds=al.get "clouds"
		clouds.scale.x=0.1
		clouds.scale.y=0.1
		clouds.scale.z=0.1
		clouds.position.y=100
		scene.add clouds
		#Ghast1
		ghast=al.get "ghastF"
		texturex1 = al.get "ghast"
		texturex1.magFilter = THREE.NearestFilter
		ghast.children[1].material.map=texturex1
		ghast.children[0].children[0].scale.set 0.01,0.01,0.01 
		ghast.children[1].material.color=new THREE.Color 0xffffff
		mat=ghast.children[1].material.clone()
		scene.add ghast
		#Ghast2
		ghast2=SkeletonUtils.clone ghast
		texturex2 = al.get "ghastS"
		texturex2.magFilter = THREE.NearestFilter
		ghast2.children[1].material=mat
		ghast2.children[1].material.map=texturex2
		ghast2.position.set 3,0,0
		scene.add ghast2
		#Player
		playerObject=al.get "player"
		texturex = al.get "steve"
		texturex.magFilter = THREE.NearestFilter
		playerObject.children[1].scale.set 1,1,1
		playerObject.children[1].position.set 25,25,25
		playerObject.children[0].material.map=texturex
		playerObject.children[0].material.color=new THREE.Color 0xffffff
		playerObject.children[1].scale.set 0.5,0.5,0.5
	)()
	
	#Animated Material
	(()->
		worldMaterial=new THREE.MeshStandardMaterial({
			side: 0
			map:null
		})    
		atlasCreator=new TextureAtlasCreator({
			textureX:al.get "blocksAtlasFull"
			textureMapping:al.get "blocksMappingFull"
		})
		savedTextures=[]
		for i in [0..9]
			t=atlasCreator.gen(i).toDataURL()
			tekstura=new THREE.TextureLoader().load t
			tekstura.magFilter = THREE.NearestFilter
			savedTextures.push tekstura
		tickq=0
		setInterval(()->
			tickq++
			tekst=savedTextures[tickq%9]
			worldMaterial.map=tekst
			worldMaterial.map.needsUpdate=true
			return
		,100)
		#setup terrain
		terrain=new Terrain({
			toxelSize:27
			cellSize:16
			blocks:al.get "blocks"
			blocksMapping:al.get "blocksMapping"
			material:worldMaterial
			scene
			camera
			worker
		})
	)()
	
	#Socket.io setup
	(()->
		server=new Server {
			ip:"#{al.get("host")}:#{al.get("websocket-port")}"
			terrain
		}
		server.onChunkUpdate (chunk)->
			console.log chunk
		#Socket.io players
		playersx={}
		server.socket.on "playerUpdate",(players)->
			sockets={}
			Object.keys(players).forEach (p)->
				sockets[p]=true
				if playersx[p] is undefined and p isnt server.socket.id
					playersx[p]=SkeletonUtils.clone playerObject
					scene.add playersx[p]
				try
					playersx[p].children[1].position.set players[p].x,players[p].y-0.5,players[p].z
					playersx[p].children[1].children[0].children[0].children[0].children[2].rotation.x=players[p].xyaw
					playersx[p].children[1].children[0].rotation.z=players[p].zyaw
				return
			Object.keys(playersx).forEach (p)->
				if sockets[p] is undefined
					scene.remove playersx[p]
					delete playersx[p]
				return
			return
		#Socket.io first world load
		server.socket.on "firstLoad",(v)->
			console.log "Otrzymano pakiet świata!"
			terrain.replaceWorld v
			worker.genCellGeo(0,0,0)
			$(".initLoading").css "display","none"
			stats = new Stats();
			stats.showPanel(0);
			document.body.appendChild stats.dom
			return
	)()
	
	#Inventory Bar
	(()->
		inv_bar = new InventoryBar({
			boxSize: 60
			padding: 4
			div: ".inventoryBar"
		}).setBoxes([
			"assets/images/grass_block.png",
			"assets/images/stone.png",
			"assets/images/oak_planks.png",
			"assets/images/smoker.gif",
			"assets/images/anvil.png",
			"assets/images/brick.png",
			"assets/images/furnace.png",
			"assets/images/bookshelf.png",
			"assets/images/tnt.png"
		]).setFocusOnly(1).listen()
	)()
	
	#First Person Controls
	(()->
		FPC = new FirstPersonControls({
			canvas
			camera
			micromove: 0.3
		}).listen()
	)()
	
	#Raycast cursor
	(()->
		cursor=new THREE.LineSegments(
			new THREE.EdgesGeometry(
				new THREE.BoxGeometry 1, 1, 1
			),
			new THREE.LineBasicMaterial {
				color: 0x000000,
				linewidth: 0.5
			}
		)
		scene.add cursor
	)()
	
	#jquery events
	(()->
		$(document).mousedown (e)->
			if FPC.gameState is "game"
				rayBlock=terrain.getRayBlock()
				if rayBlock
					if e.which is 1
						voxelId=0
						pos=rayBlock.posBreak
					else
						voxelId=inv_bar.activeBox
						pos=rayBlock.posPlace
					server.socket.emit "blockUpdate",[pos...,voxelId]
			return
	)()
	
	animate()

	return
render = ->

	#Snowflakes animation
	(()->
		time = Date.now() * 0.00005
		for i in [0..scene.children.length-1]
			object = scene.children[ i ]
			if object instanceof THREE.Points
				object.rotation.y = time * ( if i < 4 then i + 1 else - ( i + 1 ) )
		for i in [0..materials.length-1]
			color = parameters[ i ][ 0 ]
			h = ( 360 * ( color[ 0 ] + time ) % 360 ) / 360
			materials[ i ].color.setHSL h, color[ 1 ], color[ 2 ]
	)()

	#Autoresize canvas
	(()->
		width=window.innerWidth
		height=window.innerHeight
		if canvas.width isnt width or canvas.height isnt height
			canvas.width=width
			canvas.height=height
			renderer.setSize width,height,false
			camera.aspect = width / height
			camera.updateProjectionMatrix()
	)()
	
	#Player movement
	(()->
		if FPC.gameState is "game"
			server.socket.emit "playerUpdate", {
				x:camera.position.x
				y:camera.position.y
				z:camera.position.z
				xyaw:-camera.rotation.x
				zyaw:camera.rotation.y+Math.PI
			}
			FPC.camMicroMove()
	)()
	
	#Update cursor
	(()->
		rayBlock=terrain.getRayBlock()
		if rayBlock
			pos=rayBlock.posBreak
			pos[0]=Math.floor pos[0]
			pos[1]=Math.floor pos[1]
			pos[2]=Math.floor pos[2]
			cursor.position.set pos...
			cursor.visible=true
		else
			cursor.visible=false
	)()
	
	renderer.render scene, camera
	terrain.updateCells()

	return
animate = ->
	try
		stats.begin()
		render()
		stats.end()
	requestAnimationFrame animate
	return

al=new AssetLoader
$.get "assets/assetLoader.json?#{THREE.MathUtils.generateUUID()}", (assets)->
	al.load assets,()->
		console.log "AssetLoader: done loading!"
		al.get("anvil").children[0].geometry.rotateX -Math.PI/2
		al.get("anvil").children[0].geometry.translate 0,0.17,0 
		al.get("anvil").children[0].geometry.translate 0,-0.25,0 
		init()
		return
	,al
	return