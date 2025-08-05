# TimeWarp Git

TimeWarp Git is an interactive 3-D visualization of a Git repository's history, built with FastAPI, PostgreSQL, PyTorch (stub hotspot model), and React + Three.js. This innovative tool transforms the traditional linear view of Git history into an immersive three-dimensional experience, allowing developers to explore their codebase evolution through time and space.

The visualization features a dynamic timeline slider that reveals commit evolution as you navigate through the repository's history. Each file is represented as a cube in 3D space, with size and color determined by code churn metrics. Cubes glow with special effects when their hotspot score exceeds 0.8, highlighting areas of high activity or potential technical debt. The interactive interface allows users to click on any cube to view detailed Monaco diff views, providing instant access to the specific changes that occurred in that file.

TimeWarp Git is designed as a local-only application for creating compelling demo GIFs and presentations. The stack combines the performance of FastAPI for backend services, PostgreSQL for data persistence, PyTorch for machine learning-based hotspot detection, and React with Three.js for the immersive 3D frontend experience. This architecture enables real-time visualization of complex Git histories while maintaining the flexibility to work with any local repository.

## Key Features

- **Timeline Slider**: Interactive slider reveals commit evolution through time
- **3D Cube Visualization**: Files represented as cubes sized and colored by churn metrics
- **Hotspot Detection**: Cubes glow when hotspot_score > 0.8, highlighting high-activity areas
- **Monaco Diff Integration**: Click any cube to view detailed code differences
- **Local-Only Design**: Optimized for demo GIFs and local presentations
- **Real-Time Updates**: Dynamic visualization updates as you navigate through history

## Quick Start

*Quick start instructions will be added here.*

## Installation

*Installation steps will be added here.*

## Usage

*Usage instructions will be added here.*

## Contributing

*Contribution guidelines will be added here.*

## License

*License information will be added here.* 